import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Invitacion } from "@/components/Invitacion";
import { normalizarSlug, obtenerFamilia } from "@/lib/familias";

export async function generateMetadata({ params }: PageProps<"/[familia]">): Promise<Metadata> {
  const familia = await obtenerFamilia((await params).familia);
  if (!familia) return {};
  return {
    title: `${familia.nombre} · Boda Tania & Raymundo`,
    description: `${familia.nombre}, tenemos el gusto de invitarte a celebrar nuestra boda el 11 de diciembre de 2026.`,
  };
}

export default async function PaginaFamilia({ params }: PageProps<"/[familia]">) {
  const { familia: crudo } = await params;
  const familia = await obtenerFamilia(crudo);
  if (!familia) notFound();

  // /Familia%20Alba%20García → /familia-alba-garcia
  if (crudo !== familia.slug && normalizarSlug(crudo) === familia.slug) {
    redirect(`/${familia.slug}`);
  }

  return <Invitacion familia={familia} />;
}
