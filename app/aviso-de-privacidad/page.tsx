import Link from "next/link";

import { CONTACTO } from "@/config/contenido-landing";
import { Button } from "@/components/ui/button";

/**
 * Aviso de privacidad integral (RF-171), público y sin sesión — la
 * LFPDPPP lo exige. Redactado contra la ley vigente desde el 21 de marzo de
 * 2025 (ver docs/CUMPLIMIENTO.md). El domicilio y el canal de contacto ARCO
 * se jalan de `CONTACTO` en config/contenido-landing.ts — un cambio ahí
 * actualiza este aviso y las plantillas de consentimiento por igual.
 */
export default function PaginaAvisoPrivacidad() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Aviso de Privacidad Integral</h1>
        <Button variant="outline" nativeButton={false} render={<Link href="/" />}>
          Volver al inicio
        </Button>
      </div>

      <div className="space-y-4 text-sm leading-relaxed">
        <section className="space-y-1">
          <h2 className="font-semibold">1. Responsable del tratamiento</h2>
          <p>
            <strong>Programa Nuevo Amanecer, A.C.</strong>, con domicilio en {CONTACTO.domicilio},
            es responsable del tratamiento de sus datos personales, conforme a la Ley Federal de
            Protección de Datos Personales en Posesión de los Particulares (LFPDPPP), vigente
            desde el 21 de marzo de 2025.
          </p>
        </section>

        <section className="space-y-1">
          <h2 className="font-semibold">2. Datos personales que recabamos</h2>
          <p>Según el trámite que realice, podemos recabar:</p>
          <ul className="list-inside list-disc space-y-0.5">
            <li>Datos de identificación y contacto del paciente y del adulto responsable.</li>
            <li>
              Datos de salud del paciente (antecedentes médicos, diagnóstico y dictamen), que la
              ley considera <strong>datos personales sensibles</strong>.
            </li>
            <li>Datos socioeconómicos, para fines de programación de la jornada.</li>
            <li>Fotografías o video, únicamente si se firma la autorización de uso de imagen.</li>
          </ul>
        </section>

        <section className="space-y-1">
          <h2 className="font-semibold">3. Finalidades del tratamiento</h2>
          <p>
            <strong>Finalidades primarias</strong> (necesarias para el servicio): evaluar la
            elegibilidad del paciente para los servicios gratuitos de cirugía o tratamiento láser
            de labio y/o paladar hendido; contactar a la familia; integrar el expediente de la
            jornada; asignar folio; y programar la segunda revisión.
          </p>
          <p>
            <strong>Finalidades secundarias</strong> (puede oponerse sin afectar el servicio):
            generar <strong>estadísticas generales y agregadas</strong> del programa —por ejemplo,
            número de pacientes atendidos, procedimientos realizados o resultados por tipo de
            intervención, sin identificar a ninguna persona— para informes anuales, materiales de
            difusión, publicidad de la asociación y una eventual publicación de resultados del
            programa. <strong>Ningún dato personal específico</strong> —nombre, fotografía, caso
            individual— se usa con fines de difusión, publicidad o recaudación sin una
            autorización aparte, expresa y revocable, como la que ya se pide en la Autorización de
            Uso de Imagen.
          </p>
        </section>

        <section className="space-y-1">
          <h2 className="font-semibold">4. Datos sensibles y de menores de edad</h2>
          <p>
            Los datos de salud requieren su <strong>consentimiento expreso y por escrito</strong>,
            que se recaba mediante papelería firmada de forma autógrafa. Cuando el paciente es
            menor de edad, el consentimiento lo otorga su padre, madre o tutor legal.
          </p>
        </section>

        <section className="space-y-1">
          <h2 className="font-semibold">5. Personas que se registran para colaborar</h2>
          <p>
            Si usted se registra como voluntario, personal médico, estudiante o donante, tratamos
            los datos que nos proporciona en ese formulario: <strong>nombre, correo electrónico,
            teléfono, ciudad</strong> y, según el perfil, <strong>especialidad, institución,
            cédula profesional, carrera o los datos de su organización</strong>.
          </p>
          <p>
            La finalidad es <strong>contactarle, valorar su participación y organizar los equipos
            de la jornada</strong>. Estos datos no son datos sensibles y no se usan para ninguna
            finalidad distinta ni se comparten con terceros con fines comerciales.
          </p>
          <p>
            Se conservan mientras exista la posibilidad de colaboración y, después, el tiempo
            necesario para acreditar la participación en jornadas anteriores. Puede pedir en
            cualquier momento que dejemos de contactarle, por la misma vía del apartado 7.
          </p>
        </section>

        <section className="space-y-1">
          <h2 className="font-semibold">6. Transferencia de datos</h2>
          <p>
            Sus datos se almacenan en servidores operados por el proveedor tecnológico del
            sistema del programa, ubicados fuera de México. Esta transferencia internacional es
            necesaria para operar el sistema y no se comparte con terceros ajenos a ese fin.
          </p>
        </section>

        <section className="space-y-1">
          <h2 className="font-semibold">7. Derechos ARCO y su ejercicio</h2>
          <p>
            Usted puede ejercer sus derechos de <strong>Acceso, Rectificación, Cancelación y
            Oposición</strong> (ARCO), así como revocar su consentimiento, escribiendo a{" "}
            <strong>{CONTACTO.correo}</strong> o llamando al <strong>{CONTACTO.telefono}</strong>.
            Responderemos en los plazos que marca la ley.
          </p>
        </section>

        <section className="space-y-1">
          <h2 className="font-semibold">8. Cambios a este aviso</h2>
          <p>
            Este aviso puede actualizarse. La versión vigente siempre está disponible en esta
            página, sin necesidad de crear una cuenta.
          </p>
        </section>

        <p className="text-xs text-muted-foreground">Última actualización: 6 de agosto de 2026.</p>
      </div>
    </div>
  );
}
