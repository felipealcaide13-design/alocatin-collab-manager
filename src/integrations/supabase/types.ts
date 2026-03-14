export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      areas: {
        Row: {
          created_at: string
          descricao: string | null
          id: string
          lideres: string[] | null
          nome: string
          subareas_possiveis: string[] | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          id?: string
          lideres?: string[] | null
          nome: string
          subareas_possiveis?: string[] | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          descricao?: string | null
          id?: string
          lideres?: string[] | null
          nome?: string
          subareas_possiveis?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      colaborador_areas: {
        Row: {
          area_id: string
          colaborador_id: string
        }
        Insert: {
          area_id: string
          colaborador_id: string
        }
        Update: {
          area_id?: string
          colaborador_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "colaborador_areas_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "colaborador_areas_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
        ]
      }
      colaboradores: {
        Row: {
          area: string
          cargo: string
          created_at: string
          data_admissao: string
          documento: string
          email: string
          id: string
          nome_completo: string
          senioridade: Database["public"]["Enums"]["senioridade_enum"]
          status: Database["public"]["Enums"]["status_enum"]
          subarea: string | null
          time: string | null
          updated_at: string
        }
        Insert: {
          area: string
          cargo: string
          created_at?: string
          data_admissao: string
          documento: string
          email: string
          id?: string
          nome_completo: string
          senioridade: Database["public"]["Enums"]["senioridade_enum"]
          status?: Database["public"]["Enums"]["status_enum"]
          subarea?: string | null
          time?: string | null
          updated_at?: string
        }
        Update: {
          area?: string
          cargo?: string
          created_at?: string
          data_admissao?: string
          documento?: string
          email?: string
          id?: string
          nome_completo?: string
          senioridade?: Database["public"]["Enums"]["senioridade_enum"]
          status?: Database["public"]["Enums"]["status_enum"]
          subarea?: string | null
          time?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      contratos: {
        Row: {
          cliente: string
          created_at: string
          data_fim: string | null
          data_inicio: string
          descricao: string | null
          id: string
          nome: string
          status: string
          torres: string[] | null
          updated_at: string
          valor_total: number | null
        }
        Insert: {
          cliente: string
          created_at?: string
          data_fim?: string | null
          data_inicio: string
          descricao?: string | null
          id?: string
          nome: string
          status?: string
          torres?: string[] | null
          updated_at?: string
          valor_total?: number | null
        }
        Update: {
          cliente?: string
          created_at?: string
          data_fim?: string | null
          data_inicio?: string
          descricao?: string | null
          id?: string
          nome?: string
          status?: string
          torres?: string[] | null
          updated_at?: string
          valor_total?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      pilar_enum: "Engenharia" | "Produto" | "Financeiro" | "RH" | "Marketing"
      senioridade_enum:
        | "C-level"
        | "Diretor(a)"
        | "Head"
        | "Gerente"
        | "Coordenador(a)"
        | "Staf I"
        | "Staf II"
        | "Analista senior"
        | "Analista pleno"
        | "Analista junior"
      status_enum: "Ativo" | "Desligado"
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
  public: {
    Enums: {
      pilar_enum: ["Engenharia", "Produto", "Financeiro", "RH", "Marketing"],
      senioridade_enum: [
        "C-level",
        "Diretor(a)",
        "Head",
        "Gerente",
        "Coordenador(a)",
        "Staf I",
        "Staf II",
        "Analista senior",
        "Analista pleno",
        "Analista junior",
      ],
      status_enum: ["Ativo", "Desligado"],
    },
  },
} as const
