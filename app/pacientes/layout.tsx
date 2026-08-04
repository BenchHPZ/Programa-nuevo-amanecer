import { Encabezado } from "@/components/layout/encabezado";

export default function LayoutPacientes({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Encabezado modulo="Pacientes" />
      {children}
    </>
  );
}
