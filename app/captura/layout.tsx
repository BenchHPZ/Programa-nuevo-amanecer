import { Encabezado } from "@/components/layout/encabezado";

export default function LayoutCaptura({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Encabezado modulo="Captura" />
      {children}
    </>
  );
}
