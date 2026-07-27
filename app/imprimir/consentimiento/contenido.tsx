interface Datos {
  nombrePaciente: string;
  nombreResponsable: string;
  parentesco: string;
  jornadaNombre: string;
  jornadaSede: string;
  fecha: string;
}

/**
 * Borrador redactado por el equipo técnico contra la LFPDPPP vigente desde
 * el 21 de marzo de 2025 y la NOM-004. NO es asesoría legal — pendiente de
 * revisión por el asesor jurídico de la asociación antes de usarse en
 * operación real (docs/CUMPLIMIENTO.md §4). Los datos entre corchetes los
 * debe completar la asociación.
 */
export function AvisoPrivacidad({ nombrePaciente, nombreResponsable, parentesco, fecha }: Datos) {
  return (
    <div className="space-y-3 text-sm leading-relaxed">
      <h2 className="text-center text-lg font-semibold">Aviso de Privacidad Simplificado</h2>
      <p>
        <strong>Programa Nuevo Amanecer, A.C.</strong>, con domicilio en [domicilio de la
        asociación — completar], es responsable del tratamiento de los datos personales que usted
        nos proporciona con motivo de la jornada médica.
      </p>
      <p>
        <strong>Finalidad.</strong> Evaluar la elegibilidad del paciente para los servicios
        gratuitos de cirugía o tratamiento láser de labio y/o paladar hendido; contactarlo;
        integrar el expediente de la jornada; y fines estadísticos internos del programa.
      </p>
      <p>
        <strong>Datos sensibles.</strong> Se recaban datos de salud del paciente, que la ley
        considera datos personales sensibles, además de datos de identificación del paciente y
        del adulto responsable.
      </p>
      <p>
        <strong>Transferencia.</strong> Los datos se almacenan en servidores fuera de México,
        operados por el proveedor tecnológico del sistema del programa, únicamente para ese fin.
      </p>
      <p>
        <strong>Derechos ARCO.</strong> Usted puede ejercer sus derechos de acceso, rectificación,
        cancelación y oposición escribiendo a [correo o teléfono de contacto — completar].
      </p>
      <p>
        El aviso de privacidad integral, con el detalle exigido por la Ley Federal de Protección
        de Datos Personales en Posesión de los Particulares, está disponible sin necesidad de
        sesión en [dirección de la landing — completar] y de forma impresa en el módulo de
        atención.
      </p>
      <p className="pt-2">
        Al firmar, quien suscribe como adulto responsable declara haber leído este aviso y otorga
        su consentimiento expreso para el tratamiento de los datos personales y de salud del
        paciente, conforme a lo aquí descrito.
      </p>

      <div className="grid grid-cols-2 gap-4 pt-8 text-xs">
        <p>Paciente: {nombrePaciente}</p>
        <p>Fecha: {fecha}</p>
        <p>Adulto responsable: {nombreResponsable}</p>
        <p>Parentesco: {parentesco}</p>
      </div>
      <div className="grid grid-cols-2 gap-4 pt-10 text-xs">
        <p className="border-t pt-1">Firma del adulto responsable</p>
        <p className="border-t pt-1">Nombre y firma de quien capturó</p>
      </div>
    </div>
  );
}

export function Deslinde({ nombrePaciente, nombreResponsable, parentesco, jornadaNombre, fecha }: Datos) {
  return (
    <div className="space-y-3 text-sm leading-relaxed">
      <h2 className="text-center text-lg font-semibold">Deslinde de Responsabilidad — Primera Revisión</h2>
      <p>
        <strong>Programa Nuevo Amanecer, A.C.</strong> realiza jornadas médicas gratuitas de
        evaluación (primera revisión) para personas con labio y/o paladar hendido, atendidas por
        personal médico voluntario, en el marco de {jornadaNombre}.
      </p>
      <p>
        Esta primera revisión es una <strong>evaluación preliminar</strong>. No es la cirugía y no
        garantiza que el paciente sea candidato: el resultado depende del criterio médico y puede
        ser apto para cirugía, apto para tratamiento láser, no apto, o la indicación de regresar
        en una jornada posterior.
      </p>
      <p>
        El folio o constancia que se entregue al concluir esta revisión es únicamente una
        preselección para una evaluación posterior (segunda revisión); no constituye una cita
        quirúrgica confirmada.
      </p>
      <p>
        La participación en la jornada es voluntaria. El traslado, alimentación y estancia de la
        familia durante la jornada corren por su cuenta.
      </p>
      <p>
        Quien suscribe declara que la información proporcionada sobre el paciente (antecedentes
        médicos y datos de contacto) es verídica a su leal saber y entender, y entiende que
        información incompleta o incorrecta puede afectar la evaluación.
      </p>
      <p>
        Nada en este documento pretende liberar a la asociación o a su personal médico de
        responsabilidad por negligencia médica; su alcance se limita a las circunstancias aquí
        descritas.
      </p>

      <div className="grid grid-cols-2 gap-4 pt-8 text-xs">
        <p>Paciente: {nombrePaciente}</p>
        <p>Fecha: {fecha}</p>
        <p>Adulto responsable: {nombreResponsable}</p>
        <p>Parentesco: {parentesco}</p>
      </div>
      <div className="grid grid-cols-2 gap-4 pt-10 text-xs">
        <p className="border-t pt-1">Firma del adulto responsable</p>
        <p className="border-t pt-1">Nombre y firma de quien capturó</p>
      </div>
    </div>
  );
}

export function UsoImagen({ nombrePaciente, nombreResponsable, parentesco, fecha }: Datos) {
  return (
    <div className="space-y-3 text-sm leading-relaxed">
      <h2 className="text-center text-lg font-semibold">Autorización de Uso de Imagen</h2>
      <p>
        Se solicita autorización para captar y usar fotografías, video o materiales audiovisuales
        del paciente y/o del adulto responsable durante la jornada, con los siguientes usos:
        documentación institucional del programa, materiales de difusión, redes sociales,
        informes anuales y recaudación de fondos de <strong>Programa Nuevo Amanecer, A.C.</strong>
      </p>
      <p>
        <strong>Este permiso es independiente de la atención médica.</strong> Negarlo no afecta en
        absoluto la evaluación ni el acceso a los servicios del programa.
      </p>
      <p>
        La autorización es válida hasta que el firmante la revoque por escrito en [correo o
        teléfono de contacto — completar]. Las imágenes no se compartirán para fines distintos a
        los aquí señalados.
      </p>

      <div className="flex gap-8 pt-2 text-sm">
        <p>☐ Sí autorizo</p>
        <p>☐ No autorizo</p>
      </div>

      <div className="grid grid-cols-2 gap-4 pt-8 text-xs">
        <p>Paciente: {nombrePaciente}</p>
        <p>Fecha: {fecha}</p>
        <p>Adulto responsable: {nombreResponsable}</p>
        <p>Parentesco: {parentesco}</p>
      </div>
      <div className="grid grid-cols-2 gap-4 pt-10 text-xs">
        <p className="border-t pt-1">Firma del adulto responsable</p>
        <p className="border-t pt-1">Nombre y firma de quien capturó</p>
      </div>
    </div>
  );
}
