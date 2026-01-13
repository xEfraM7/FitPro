"use server"

import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"

export type ActivityAction =
  | "create" | "update" | "delete"
  | "payment_registered" | "payment_deleted"
  | "member_created" | "member_updated" | "member_deleted"
  | "plan_created" | "plan_updated" | "plan_deleted"
  | "class_created" | "class_updated" | "class_deleted"
  | "class_payment_registered" | "class_payment_deleted"
  | "rate_updated" | "role_updated" | "invitation_sent"
  | "monthly_closing_created" | "funds_reset"

export type EntityType =
  | "payment" | "member" | "plan" | "special_class"
  | "special_class_payment" | "exchange_rate" | "role" | "admin"
  | "monthly_closing" | "fund"

interface LogActivityParams {
  action: ActivityAction
  entityType: EntityType
  entityId?: string
  entityName?: string
  details?: Record<string, any>
}

import { getUserOrganizationId } from "@/lib/auth-helpers"

export async function logActivity(params: LogActivityParams) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return // No log for unauthenticated users? Or maybe system log?

  let adminName = user.user_metadata?.name || user.email || "Usuario"
  let orgId: string | null = null

  try {
    const { orgId: id } = await getUserOrganizationId()
    orgId = id
  } catch (e) {
    console.warn("Could not determine organization for activity log")
  }

  const { error } = await supabase.from("activity_log").insert({
    organization_id: orgId,
    admin_id: user.id, // Using auth user id instead of admins table id
    admin_name: adminName,
    action: params.action,
    entity_type: params.entityType,
    entity_id: params.entityId,
    entity_name: params.entityName,
    details: params.details,
  })

  if (error) console.error("Error logging activity:", error)
  revalidatePath("/dashboard")
}

export async function getActivityLog(limit = 20, startDate?: string, endDate?: string) {
  const supabase = await createClient()

  let query = supabase
    .from("activity_log")
    .select("*")
    .order("created_at", { ascending: false })

  if (startDate) {
    query = query.gte("created_at", startDate)
  }

  if (endDate) {
    // Agregar un día al endDate para incluir todo el día
    const end = new Date(endDate)
    end.setDate(end.getDate() + 1)
    query = query.lt("created_at", end.toISOString())
  }

  query = query.limit(limit)

  const { data, error } = await query

  if (error) throw error
  return data
}
