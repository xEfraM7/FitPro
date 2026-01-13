"use server"

import { createClient, createAdminClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"
import type { TablesInsert, TablesUpdate } from "@/types/database"

import { getUserOrganizationId } from "@/lib/auth-helpers"

// Temporary permission check: Only owners can manage roles
// Temporary permission check: Only owners can manage roles
async function checkRolePermission(supabase: any, requiredPermission: string): Promise<boolean> {
  const { role, orgId } = await getUserOrganizationId()
  // For now, assume 'owner' has all permissions
  if (role === "owner") return true

  // Check if role has the required permission
  const { data: roleData } = await supabase
    .from("roles")
    .select("permissions")
    .eq("organization_id", orgId)
    .eq("name", role)
    .single()

  const permissions = roleData?.permissions || []
  return permissions.includes(requiredPermission)
}

export async function getCurrentAdminPermissions() {
  const supabase = await createClient()
  try {
    const { orgId, role } = await getUserOrganizationId()

    if (role === "owner") {
      return { isAdmin: true, permissions: [] }
    }

    const { data: roleData } = await supabase
      .from("roles")
      .select("permissions")
      .eq("organization_id", orgId)
      .eq("name", role)
      .single()

    return {
      isAdmin: false,
      permissions: roleData?.permissions || []
    }
  } catch (error) {
    return { isAdmin: false, permissions: [] }
  }
}

export async function getRoles() {
  const supabase = await createClient()
  const { orgId } = await getUserOrganizationId()

  const { data, error } = await supabase
    .from("roles")
    .select("*")
    .eq("organization_id", orgId)
    .order("name")

  if (error) throw error
  return data
}

export async function createRole(role: TablesInsert<"roles">) {
  const supabase = await createClient()
  const hasPermission = await checkRolePermission(supabase, "roles.create")
  if (!hasPermission) throw new Error("No tienes permisos para crear roles")

  const { orgId } = await getUserOrganizationId()

  const { data, error } = await supabase
    .from("roles")
    .insert({ ...role, organization_id: orgId })
    .select()
    .single()

  if (error) throw error
  revalidatePath("/dashboard/roles")
  return data
}

export async function updateRole(id: string, role: TablesUpdate<"roles">) {
  const supabase = await createClient()
  const hasPermission = await checkRolePermission(supabase, "roles.edit")
  if (!hasPermission) throw new Error("No tienes permisos para editar roles")

  const { orgId } = await getUserOrganizationId()

  const { data, error } = await supabase
    .from("roles")
    .update({ ...role, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("organization_id", orgId) // Secure update
    .select()
    .single()

  if (error) throw error
  revalidatePath("/dashboard/roles")
  return data
}

export async function deleteRole(id: string) {
  const supabase = await createClient()
  const hasPermission = await checkRolePermission(supabase, "roles.delete")
  if (!hasPermission) throw new Error("No tienes permisos para eliminar roles")

  const { orgId } = await getUserOrganizationId()

  const { error } = await supabase
    .from("roles")
    .delete()
    .eq("id", id)
    .eq("organization_id", orgId) // Secure delete

  if (error) throw error
  revalidatePath("/dashboard/roles")
}

export async function createAdmin(adminData: any) {
  const supabase = await createClient()
  const { orgId } = await getUserOrganizationId()
  const supabaseAdmin = await createAdminClient()

  // 1. Resolve Auth User
  let authUserId = adminData.auth_user_id

  if (!authUserId && adminData.email) {
    const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(adminData.email)
    if (data.user) {
      authUserId = data.user.id
    }
  }

  if (!authUserId) throw new Error("No se pudo encontrar ni crear el usuario. Asegúrese de que el correo sea válido.")

  // 2. Resolve Role Name
  const { data: role } = await supabase
    .from("roles")
    .select("name")
    .eq("id", adminData.role_id)
    .single()

  const roleName = role?.name || "member"

  // 3. Insert into admins table
  const { data: newAdmin, error } = await supabase
    .from("admins")
    .insert({
      organization_id: orgId,
      auth_user_id: authUserId,
      name: adminData.name,
      email: adminData.email,
      role_id: adminData.role_id,
      status: adminData.status || 'active'
    })
    .select()
    .single()

  if (error) throw error

  // 4. Sync to organization_members
  const { data: existingMember } = await supabaseAdmin
    .from("organization_members")
    .select("id")
    .eq("organization_id", orgId)
    .eq("user_id", authUserId)
    .single()

  if (existingMember) {
    await supabaseAdmin
      .from("organization_members")
      .update({ role: roleName })
      .eq("id", existingMember.id)
  } else {
    await supabaseAdmin
      .from("organization_members")
      .insert({
        organization_id: orgId,
        user_id: authUserId,
        role: roleName
      })
  }

  revalidatePath("/dashboard/roles")
  return newAdmin
}

export async function updateAdmin(id: string, adminData: any) {
  const supabase = await createClient()
  const { orgId } = await getUserOrganizationId()
  const supabaseAdmin = await createAdminClient()

  const { data: updatedAdmin, error } = await supabase
    .from("admins")
    .update({
      name: adminData.name,
      role_id: adminData.role_id,
      status: adminData.status,
      updated_at: new Date().toISOString()
    })
    .eq("id", id)
    .eq("organization_id", orgId)
    .select()
    .single()

  if (error) throw error

  if (adminData.role_id && updatedAdmin.auth_user_id) {
    const { data: role } = await supabase
      .from("roles")
      .select("name")
      .eq("id", adminData.role_id)
      .single()

    if (role) {
      await supabaseAdmin
        .from("organization_members")
        .update({ role: role.name })
        .eq("organization_id", orgId)
        .eq("user_id", updatedAdmin.auth_user_id)
    }
  }

  revalidatePath("/dashboard/roles")
  return updatedAdmin
}

export async function deleteAdmin(id: string) {
  const supabase = await createClient()
  const { orgId } = await getUserOrganizationId()
  const supabaseAdmin = await createAdminClient()

  const { data: admin } = await supabase
    .from("admins")
    .select("auth_user_id")
    .eq("id", id)
    .single()

  const { error } = await supabase
    .from("admins")
    .delete()
    .eq("id", id)
    .eq("organization_id", orgId)

  if (error) throw error

  if (admin?.auth_user_id) {
    await supabaseAdmin
      .from("organization_members")
      .delete()
      .eq("organization_id", orgId)
      .eq("user_id", admin.auth_user_id)
  }

  revalidatePath("/dashboard/roles")
}

export async function getAdmins() {
  const supabase = await createClient()
  const { orgId } = await getUserOrganizationId()

  const { data, error } = await supabase
    .from("admins")
    .select("*, roles(name)")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false })

  if (error) throw error
  return data
}

export async function getAllAdmins() {
  return getAdmins()
}

export async function getAuthUsers() {
  return []
}

export async function getAllAuthUsers() {
  return []
}

export async function deleteUser(authUserId: string) {
  throw new Error("Deletion of users not supported.")
}

export async function sendInvitation(email: string, name?: string) {
  const supabase = await createClient()
  const { orgId } = await getUserOrganizationId()
  const supabaseAdmin = await createAdminClient()

  // 1. Invite User
  const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email)

  if (inviteError) throw inviteError
  if (!inviteData.user) throw new Error("No se pudo invitar al usuario")

  const authUserId = inviteData.user.id

  // 2. Find "Basico" Role
  const { data: role } = await supabase
    .from("roles")
    .select("id, name")
    .eq("organization_id", orgId)
    .ilike("name", "Basico")
    .single()

  const roleId = role?.id
  const roleName = role?.name || "Basico"

  // 3. Add to admins table
  const { data: existingAdmin } = await supabase
    .from("admins")
    .select("id")
    .eq("organization_id", orgId)
    .eq("email", email)
    .single()

  if (!existingAdmin) {
    await supabase
      .from("admins")
      .insert({
        organization_id: orgId,
        auth_user_id: authUserId,
        name: name || email.split("@")[0],
        email: email,
        role_id: roleId,
        status: 'active'
      })
  }

  // 4. Sync to organization_members
  const { data: existingMember } = await supabaseAdmin
    .from("organization_members")
    .select("id")
    .eq("organization_id", orgId)
    .eq("user_id", authUserId)
    .single()

  if (existingMember) {
    await supabaseAdmin
      .from("organization_members")
      .update({ role: roleName })
      .eq("id", existingMember.id)
  } else {
    await supabaseAdmin
      .from("organization_members")
      .insert({
        organization_id: orgId,
        user_id: authUserId,
        role: roleName
      })
  }

  revalidatePath("/dashboard/roles")
  return { success: true }
}



