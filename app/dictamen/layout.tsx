import { Encabezado } from "@/components/layout/encabezado";

export default function LayoutDictamen({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Encabezado modulo="Dictamen" />
      {children}
    </>
  );
}
