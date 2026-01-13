"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createOrganization } from "@/lib/actions/onboarding"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Building2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function CreateOrganizationForm() {
    const [error, setError] = useState("")
    const [isLoading, setIsLoading] = useState(false)

    // Basic slug generator
    const [name, setName] = useState("")
    const [slug, setSlug] = useState("")

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value
        setName(val)
        // Auto-generate slug from name if user hasn't manually edited slug too much
        // For simplicity, just auto-gen always for now on name change
        setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""))
    }

    async function onSubmit(formData: FormData) {
        setIsLoading(true)
        setError("")

        const res = await createOrganization(formData)

        if (res?.error) {
            setError(res.error)
            setIsLoading(false)
        }
        // If success, server action redirects, so we don't need to do anything here
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <Card className="w-full max-w-lg border-border/50 shadow-xl">
                <CardHeader className="text-center">
                    <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                        <Building2 className="w-8 h-8 text-primary" />
                    </div>
                    <CardTitle className="text-2xl">Configura tu Gimnasio</CardTitle>
                    <CardDescription>
                        Crea tu organización para empezar a gestionar tus miembros y clases.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={onSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nombre del Gimnasio</Label>
                            <Input
                                id="name"
                                name="name"
                                placeholder="Ej. FitPro Platinum"
                                required
                                value={name}
                                onChange={handleNameChange}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="slug">Identificador (URL)</Label>
                            <Input
                                id="slug"
                                name="slug"
                                placeholder="fitpro-platinum"
                                required
                                value={slug}
                                onChange={(e) => setSlug(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">
                                Se usará para tu acceso único: app.fitpro.com/{slug || "tu-gimnasio"}
                            </p>
                        </div>

                        {error && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? "Creando..." : "Crear Organización"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
