export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      audit_log: {
        Row: {
          accion: string
          datos_antes: Json | null
          datos_despues: Json | null
          id: number
          registro_id: string
          tabla: string
          ts: string
          usuario_id: string | null
        }
        Insert: {
          accion: string
          datos_antes?: Json | null
          datos_despues?: Json | null
          id?: never
          registro_id: string
          tabla: string
          ts?: string
          usuario_id?: string | null
        }
        Update: {
          accion?: string
          datos_antes?: Json | null
          datos_despues?: Json | null
          id?: never
          registro_id?: string
          tabla?: string
          ts?: string
          usuario_id?: string | null
        }
        Relationships: []
      }
      catalogo_campos: {
        Row: {
          creado_en: string
          definicion: Json
          id: string
          jornada_id: string
          seccion: Database["public"]["Enums"]["tipo_seccion"]
          version: number
          vigente: boolean
        }
        Insert: {
          creado_en?: string
          definicion: Json
          id?: string
          jornada_id: string
          seccion: Database["public"]["Enums"]["tipo_seccion"]
          version?: number
          vigente?: boolean
        }
        Update: {
          creado_en?: string
          definicion?: Json
          id?: string
          jornada_id?: string
          seccion?: Database["public"]["Enums"]["tipo_seccion"]
          version?: number
          vigente?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "catalogo_campos_jornada_id_fkey"
            columns: ["jornada_id"]
            isOneToOne: false
            referencedRelation: "jornada"
            referencedColumns: ["id"]
          },
        ]
      }
      catalogo_dictamen: {
        Row: {
          creado_en: string
          definicion: Json
          id: string
          jornada_id: string
          version: number
          vigente: boolean
        }
        Insert: {
          creado_en?: string
          definicion: Json
          id?: string
          jornada_id: string
          version?: number
          vigente?: boolean
        }
        Update: {
          creado_en?: string
          definicion?: Json
          id?: string
          jornada_id?: string
          version?: number
          vigente?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "catalogo_dictamen_jornada_id_fkey"
            columns: ["jornada_id"]
            isOneToOne: false
            referencedRelation: "jornada"
            referencedColumns: ["id"]
          },
        ]
      }
      consentimiento: {
        Row: {
          archivo_path: string
          capturado_por: string | null
          creado_en: string
          expediente_id: string
          firmado_en: string | null
          id: string
          tipo: Database["public"]["Enums"]["tipo_consentimiento"]
        }
        Insert: {
          archivo_path: string
          capturado_por?: string | null
          creado_en?: string
          expediente_id: string
          firmado_en?: string | null
          id?: string
          tipo: Database["public"]["Enums"]["tipo_consentimiento"]
        }
        Update: {
          archivo_path?: string
          capturado_por?: string | null
          creado_en?: string
          expediente_id?: string
          firmado_en?: string | null
          id?: string
          tipo?: Database["public"]["Enums"]["tipo_consentimiento"]
        }
        Relationships: [
          {
            foreignKeyName: "consentimiento_capturado_por_fkey"
            columns: ["capturado_por"]
            isOneToOne: false
            referencedRelation: "usuario_perfil"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consentimiento_expediente_id_fkey"
            columns: ["expediente_id"]
            isOneToOne: false
            referencedRelation: "expediente"
            referencedColumns: ["id"]
          },
        ]
      }
      dictamen_etapa1: {
        Row: {
          expediente_id: string
          fecha: string
          firma_archivo_path: string | null
          id: string
          medico_id: string
          observaciones: string | null
          recomendacion: string | null
          resultado: Database["public"]["Enums"]["resultado_dictamen"]
        }
        Insert: {
          expediente_id: string
          fecha?: string
          firma_archivo_path?: string | null
          id?: string
          medico_id: string
          observaciones?: string | null
          recomendacion?: string | null
          resultado: Database["public"]["Enums"]["resultado_dictamen"]
        }
        Update: {
          expediente_id?: string
          fecha?: string
          firma_archivo_path?: string | null
          id?: string
          medico_id?: string
          observaciones?: string | null
          recomendacion?: string | null
          resultado?: Database["public"]["Enums"]["resultado_dictamen"]
        }
        Relationships: [
          {
            foreignKeyName: "dictamen_etapa1_expediente_id_fkey"
            columns: ["expediente_id"]
            isOneToOne: true
            referencedRelation: "expediente"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dictamen_etapa1_medico_id_fkey"
            columns: ["medico_id"]
            isOneToOne: false
            referencedRelation: "usuario_perfil"
            referencedColumns: ["id"]
          },
        ]
      }
      documento: {
        Row: {
          activo: boolean
          archivo_path: string
          creado_en: string
          expediente_id: string
          id: string
          subido_por: string | null
          tipo: Database["public"]["Enums"]["tipo_documento"]
          vista_foto: Database["public"]["Enums"]["vista_foto"] | null
        }
        Insert: {
          activo?: boolean
          archivo_path: string
          creado_en?: string
          expediente_id: string
          id?: string
          subido_por?: string | null
          tipo: Database["public"]["Enums"]["tipo_documento"]
          vista_foto?: Database["public"]["Enums"]["vista_foto"] | null
        }
        Update: {
          activo?: boolean
          archivo_path?: string
          creado_en?: string
          expediente_id?: string
          id?: string
          subido_por?: string | null
          tipo?: Database["public"]["Enums"]["tipo_documento"]
          vista_foto?: Database["public"]["Enums"]["vista_foto"] | null
        }
        Relationships: [
          {
            foreignKeyName: "documento_expediente_id_fkey"
            columns: ["expediente_id"]
            isOneToOne: false
            referencedRelation: "expediente"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documento_subido_por_fkey"
            columns: ["subido_por"]
            isOneToOne: false
            referencedRelation: "usuario_perfil"
            referencedColumns: ["id"]
          },
        ]
      }
      expediente: {
        Row: {
          activo: boolean
          creado_en: string
          creado_por: string | null
          estado: Database["public"]["Enums"]["estado_expediente"]
          id: string
          jornada_id: string
          paciente_id: string
        }
        Insert: {
          activo?: boolean
          creado_en?: string
          creado_por?: string | null
          estado?: Database["public"]["Enums"]["estado_expediente"]
          id?: string
          jornada_id: string
          paciente_id: string
        }
        Update: {
          activo?: boolean
          creado_en?: string
          creado_por?: string | null
          estado?: Database["public"]["Enums"]["estado_expediente"]
          id?: string
          jornada_id?: string
          paciente_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expediente_creado_por_fkey"
            columns: ["creado_por"]
            isOneToOne: false
            referencedRelation: "usuario_perfil"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expediente_jornada_id_fkey"
            columns: ["jornada_id"]
            isOneToOne: false
            referencedRelation: "jornada"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expediente_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "persona"
            referencedColumns: ["id"]
          },
        ]
      }
      expediente_seccion: {
        Row: {
          actualizado_en: string
          completa: boolean
          datos: Json
          expediente_id: string
          id: string
          seccion: Database["public"]["Enums"]["tipo_seccion"]
        }
        Insert: {
          actualizado_en?: string
          completa?: boolean
          datos?: Json
          expediente_id: string
          id?: string
          seccion: Database["public"]["Enums"]["tipo_seccion"]
        }
        Update: {
          actualizado_en?: string
          completa?: boolean
          datos?: Json
          expediente_id?: string
          id?: string
          seccion?: Database["public"]["Enums"]["tipo_seccion"]
        }
        Relationships: [
          {
            foreignKeyName: "expediente_seccion_expediente_id_fkey"
            columns: ["expediente_id"]
            isOneToOne: false
            referencedRelation: "expediente"
            referencedColumns: ["id"]
          },
        ]
      }
      folio: {
        Row: {
          activo: boolean
          consecutivo: number
          creado_en: string
          digito_verificador: number
          expediente_id: string
          folio_texto: string
          id: string
          jornada_id: string
          sede: string
          servicio: Database["public"]["Enums"]["servicio_tipo"]
        }
        Insert: {
          activo?: boolean
          consecutivo: number
          creado_en?: string
          digito_verificador: number
          expediente_id: string
          folio_texto: string
          id?: string
          jornada_id: string
          sede?: string
          servicio: Database["public"]["Enums"]["servicio_tipo"]
        }
        Update: {
          activo?: boolean
          consecutivo?: number
          creado_en?: string
          digito_verificador?: number
          expediente_id?: string
          folio_texto?: string
          id?: string
          jornada_id?: string
          sede?: string
          servicio?: Database["public"]["Enums"]["servicio_tipo"]
        }
        Relationships: [
          {
            foreignKeyName: "folio_expediente_id_fkey"
            columns: ["expediente_id"]
            isOneToOne: false
            referencedRelation: "expediente"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "folio_jornada_id_fkey"
            columns: ["jornada_id"]
            isOneToOne: false
            referencedRelation: "jornada"
            referencedColumns: ["id"]
          },
        ]
      }
      folio_contador: {
        Row: {
          jornada_id: string
          sede: string
          servicio: Database["public"]["Enums"]["servicio_tipo"]
          ultimo: number
        }
        Insert: {
          jornada_id: string
          sede?: string
          servicio: Database["public"]["Enums"]["servicio_tipo"]
          ultimo?: number
        }
        Update: {
          jornada_id?: string
          sede?: string
          servicio?: Database["public"]["Enums"]["servicio_tipo"]
          ultimo?: number
        }
        Relationships: [
          {
            foreignKeyName: "folio_contador_jornada_id_fkey"
            columns: ["jornada_id"]
            isOneToOne: false
            referencedRelation: "jornada"
            referencedColumns: ["id"]
          },
        ]
      }
      jornada: {
        Row: {
          clave: string
          creado_en: string
          estado: Database["public"]["Enums"]["estado_jornada"]
          fecha_etapa2: string | null
          fecha_fin_etapa1: string
          fecha_inicio_etapa1: string
          id: string
          nombre: string
          sede: string
        }
        Insert: {
          clave: string
          creado_en?: string
          estado?: Database["public"]["Enums"]["estado_jornada"]
          fecha_etapa2?: string | null
          fecha_fin_etapa1: string
          fecha_inicio_etapa1: string
          id?: string
          nombre: string
          sede: string
        }
        Update: {
          clave?: string
          creado_en?: string
          estado?: Database["public"]["Enums"]["estado_jornada"]
          fecha_etapa2?: string | null
          fecha_fin_etapa1?: string
          fecha_inicio_etapa1?: string
          id?: string
          nombre?: string
          sede?: string
        }
        Relationships: []
      }
      paciente_responsable: {
        Row: {
          creado_en: string
          es_principal: boolean
          id: string
          paciente_id: string
          parentesco: string
          responsable_id: string
        }
        Insert: {
          creado_en?: string
          es_principal?: boolean
          id?: string
          paciente_id: string
          parentesco: string
          responsable_id: string
        }
        Update: {
          creado_en?: string
          es_principal?: boolean
          id?: string
          paciente_id?: string
          parentesco?: string
          responsable_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "paciente_responsable_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "persona"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "paciente_responsable_responsable_id_fkey"
            columns: ["responsable_id"]
            isOneToOne: false
            referencedRelation: "persona"
            referencedColumns: ["id"]
          },
        ]
      }
      persona: {
        Row: {
          activo: boolean
          apellido_materno: string | null
          apellido_paterno: string
          correo: string | null
          creado_en: string
          creado_por: string | null
          curp: string | null
          direccion: string | null
          estado_geografico: string | null
          fecha_nacimiento: string
          id: string
          localidad: string | null
          municipio: string | null
          nombre: string
          nombre_normalizado: string | null
          sexo: string
          telefono: string | null
          telefono_alterno: string | null
        }
        Insert: {
          activo?: boolean
          apellido_materno?: string | null
          apellido_paterno: string
          correo?: string | null
          creado_en?: string
          creado_por?: string | null
          curp?: string | null
          direccion?: string | null
          estado_geografico?: string | null
          fecha_nacimiento: string
          id?: string
          localidad?: string | null
          municipio?: string | null
          nombre: string
          nombre_normalizado?: string | null
          sexo: string
          telefono?: string | null
          telefono_alterno?: string | null
        }
        Update: {
          activo?: boolean
          apellido_materno?: string | null
          apellido_paterno?: string
          correo?: string | null
          creado_en?: string
          creado_por?: string | null
          curp?: string | null
          direccion?: string | null
          estado_geografico?: string | null
          fecha_nacimiento?: string
          id?: string
          localidad?: string | null
          municipio?: string | null
          nombre?: string
          nombre_normalizado?: string | null
          sexo?: string
          telefono?: string | null
          telefono_alterno?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "persona_creado_por_fkey"
            columns: ["creado_por"]
            isOneToOne: false
            referencedRelation: "usuario_perfil"
            referencedColumns: ["id"]
          },
        ]
      }
      pre_registro: {
        Row: {
          creado_en: string
          datos: Json
          estado: Database["public"]["Enums"]["estado_pre_registro"]
          expediente_id: string | null
          id: string
        }
        Insert: {
          creado_en?: string
          datos: Json
          estado?: Database["public"]["Enums"]["estado_pre_registro"]
          expediente_id?: string | null
          id?: string
        }
        Update: {
          creado_en?: string
          datos?: Json
          estado?: Database["public"]["Enums"]["estado_pre_registro"]
          expediente_id?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pre_registro_expediente_id_fkey"
            columns: ["expediente_id"]
            isOneToOne: false
            referencedRelation: "expediente"
            referencedColumns: ["id"]
          },
        ]
      }
      registro_colaborador: {
        Row: {
          creado_en: string
          datos: Json
          estado: Database["public"]["Enums"]["estado_colaborador"]
          id: string
          notas: string | null
          tipo: Database["public"]["Enums"]["tipo_colaborador"]
          usuario_id: string | null
        }
        Insert: {
          creado_en?: string
          datos: Json
          estado?: Database["public"]["Enums"]["estado_colaborador"]
          id?: string
          notas?: string | null
          tipo: Database["public"]["Enums"]["tipo_colaborador"]
          usuario_id?: string | null
        }
        Update: {
          creado_en?: string
          datos?: Json
          estado?: Database["public"]["Enums"]["estado_colaborador"]
          id?: string
          notas?: string | null
          tipo?: Database["public"]["Enums"]["tipo_colaborador"]
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "registro_colaborador_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuario_perfil"
            referencedColumns: ["id"]
          },
        ]
      }
      usuario_perfil: {
        Row: {
          aprobado_en: string | null
          aprobado_por: string | null
          creado_en: string
          estado: Database["public"]["Enums"]["estado_usuario"]
          id: string
          nombre: string
          rol: Database["public"]["Enums"]["rol_usuario"] | null
        }
        Insert: {
          aprobado_en?: string | null
          aprobado_por?: string | null
          creado_en?: string
          estado?: Database["public"]["Enums"]["estado_usuario"]
          id: string
          nombre: string
          rol?: Database["public"]["Enums"]["rol_usuario"] | null
        }
        Update: {
          aprobado_en?: string | null
          aprobado_por?: string | null
          creado_en?: string
          estado?: Database["public"]["Enums"]["estado_usuario"]
          id?: string
          nombre?: string
          rol?: Database["public"]["Enums"]["rol_usuario"] | null
        }
        Relationships: [
          {
            foreignKeyName: "usuario_perfil_aprobado_por_fkey"
            columns: ["aprobado_por"]
            isOneToOne: false
            referencedRelation: "usuario_perfil"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      vista_conteos_jornada: {
        Row: {
          apto_cirugia: number | null
          apto_laser: number | null
          borradores: number | null
          cirugia_guanajuato: number | null
          cirugia_leon: number | null
          completos: number | null
          dictaminados: number | null
          dictaminados_hoy: number | null
          expedientes: number | null
          expedientes_hoy: number | null
          jornada_id: string | null
          no_apto: number | null
          regresar_6_meses: number | null
        }
        Relationships: [
          {
            foreignKeyName: "expediente_jornada_id_fkey"
            columns: ["jornada_id"]
            isOneToOne: false
            referencedRelation: "jornada"
            referencedColumns: ["id"]
          },
        ]
      }
      vista_conteos_publicos: {
        Row: {
          apto_cirugia: number | null
          apto_laser: number | null
          completos: number | null
          dictaminados: number | null
          jornada_id: string | null
          registrados_hoy: number | null
          total_expedientes: number | null
        }
        Relationships: [
          {
            foreignKeyName: "expediente_jornada_id_fkey"
            columns: ["jornada_id"]
            isOneToOne: false
            referencedRelation: "jornada"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      asignar_folio: {
        Args: {
          p_expediente_id: string
          p_servicio: Database["public"]["Enums"]["servicio_tipo"]
        }
        Returns: {
          activo: boolean
          consecutivo: number
          creado_en: string
          digito_verificador: number
          expediente_id: string
          folio_texto: string
          id: string
          jornada_id: string
          servicio: Database["public"]["Enums"]["servicio_tipo"]
        }
        SetofOptions: {
          from: "*"
          to: "folio"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      buscar_persona_similar: {
        Args: {
          p_apellido_materno?: string
          p_apellido_paterno?: string
          p_curp?: string
          p_fecha_nacimiento?: string
          p_nombre?: string
          p_sexo?: string
          p_telefono?: string
        }
        Returns: {
          apellido_materno: string
          apellido_paterno: string
          curp: string
          fecha_nacimiento: string
          id: string
          motivo: string
          nombre: string
          sexo: string
          similitud: number
          telefono: string
        }[]
      }
      calcular_digito_verificador: {
        Args: { p_texto: string }
        Returns: number
      }
      es_administrativo: { Args: never; Returns: boolean }
      esta_activo: { Args: never; Returns: boolean }
      importar_expediente_contingencia: {
        Args: {
          p_jornada_id: string
          p_paciente: Json
          p_parentesco: string
          p_responsable: Json
        }
        Returns: string
      }
      puede_escribir: { Args: never; Returns: boolean }
      registrar_dictamen: {
        Args: {
          p_expediente_id: string
          p_observaciones?: string
          p_recomendacion?: string
          p_resultado: Database["public"]["Enums"]["resultado_dictamen"]
        }
        Returns: {
          dictamen: Database["public"]["Tables"]["dictamen_etapa1"]["Row"]
          folio: Database["public"]["Tables"]["folio"]["Row"]
        }[]
      }
      registrar_exportacion: {
        Args: { p_filas: number; p_filtros: Json; p_jornada_id: string }
        Returns: undefined
      }
      rol_actual: {
        Args: never
        Returns: Database["public"]["Enums"]["rol_usuario"]
      }
      sin_acentos: { Args: { p_texto: string }; Returns: string }
      tiene_rol: {
        Args: { roles: Database["public"]["Enums"]["rol_usuario"][] }
        Returns: boolean
      }
    }
    Enums: {
      estado_colaborador: "nuevo" | "contactado" | "aceptado" | "descartado"
      estado_expediente: "borrador" | "completo" | "dictaminado"
      estado_jornada: "planeada" | "etapa1" | "etapa2" | "cerrada"
      estado_pre_registro: "nuevo" | "validado" | "descartado"
      estado_usuario: "pendiente" | "activo" | "suspendido"
      resultado_dictamen:
        | "apto_cirugia"
        | "apto_laser"
        | "no_apto"
        | "regresar_6_meses"
        | "cirugia_guanajuato"
        | "cirugia_leon"
      rol_usuario:
        | "capturista"
        | "informista"
        | "administrativo"
        | "medico_triage"
        | "primer_contacto"
        | "autorizador"
        | "evaluador_prequirurgico"
        | "programador"
      servicio_tipo: "cirugia" | "laser"
      tipo_colaborador:
        | "medico"
        | "enfermeria_estudiante"
        | "apoyo_general"
        | "donativo"
      tipo_consentimiento:
        | "aviso_privacidad"
        | "deslinde"
        | "uso_imagen"
        | "consentimiento_informado"
      tipo_documento:
        | "acta"
        | "curp"
        | "ine_responsable"
        | "comprobante_domicilio"
        | "estudio_previo"
        | "foto_paciente"
      tipo_seccion: "antecedentes" | "socioeconomico"
      vista_foto: "anterior" | "lateral_derecha" | "lateral_izquierda"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      estado_colaborador: ["nuevo", "contactado", "aceptado", "descartado"],
      estado_expediente: ["borrador", "completo", "dictaminado"],
      estado_jornada: ["planeada", "etapa1", "etapa2", "cerrada"],
      estado_pre_registro: ["nuevo", "validado", "descartado"],
      estado_usuario: ["pendiente", "activo", "suspendido"],
      resultado_dictamen: [
        "apto_cirugia",
        "apto_laser",
        "no_apto",
        "regresar_6_meses",
        "cirugia_guanajuato",
        "cirugia_leon",
      ],
      rol_usuario: [
        "capturista",
        "informista",
        "administrativo",
        "medico_triage",
        "primer_contacto",
        "autorizador",
        "evaluador_prequirurgico",
        "programador",
      ],
      servicio_tipo: ["cirugia", "laser"],
      tipo_colaborador: [
        "medico",
        "enfermeria_estudiante",
        "apoyo_general",
        "donativo",
      ],
      tipo_consentimiento: [
        "aviso_privacidad",
        "deslinde",
        "uso_imagen",
        "consentimiento_informado",
      ],
      tipo_documento: [
        "acta",
        "curp",
        "ine_responsable",
        "comprobante_domicilio",
        "estudio_previo",
        "foto_paciente",
      ],
      tipo_seccion: ["antecedentes", "socioeconomico"],
      vista_foto: ["anterior", "lateral_derecha", "lateral_izquierda"],
    },
  },
} as const





// ── Alias de conveniencia ───────────────────────────────────────────────
// Import corto (`import type { RolUsuario } from "@/lib/supabase/tipos"`)
// en vez de indexar Database["public"]["Enums"][...] en cada archivo.
type EnumsPublicas = Database["public"]["Enums"];

export type RolUsuario = EnumsPublicas["rol_usuario"];
export type EstadoUsuario = EnumsPublicas["estado_usuario"];
export type EstadoJornada = EnumsPublicas["estado_jornada"];
export type ServicioTipo = EnumsPublicas["servicio_tipo"];
export type EstadoExpediente = EnumsPublicas["estado_expediente"];
export type ResultadoDictamen = EnumsPublicas["resultado_dictamen"];
export type TipoSeccion = EnumsPublicas["tipo_seccion"];
export type TipoConsentimiento = EnumsPublicas["tipo_consentimiento"];
export type TipoDocumento = EnumsPublicas["tipo_documento"];
export type VistaFoto = EnumsPublicas["vista_foto"];
export type EstadoPreRegistro = EnumsPublicas["estado_pre_registro"];

