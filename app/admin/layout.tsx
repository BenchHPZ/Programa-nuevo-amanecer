import { Encabezado } from "@/components/layout/encabezado";

export default function LayoutAdmin({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Encabezado modulo="Panel administrativo" />
      {children}
    </>
  );
}
