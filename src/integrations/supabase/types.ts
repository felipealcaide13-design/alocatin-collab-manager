export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      diretorias: {
        Row: {
          id: string
          nome: string
          descricao: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nome: string
          descricao?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nome?: string
          descricao?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      areas: {
        Row: {
          id: string
          nome: string
          diretoria_id: string | null
          lideres: string[]
          subareas_possiveis: string[]
          descricao: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nome: string
          diretoria_id?: string | null
          lideres?: string[]
          subareas_possiveis?: string[]
          descricao?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nome?: string
          diretoria_id?: string | null
          lideres?: string[]
          subareas_possiveis?: string[]
          descricao?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "areas_diretoria_id_fkey"
            columns: ["diretoria_id"]
            isOneToOne: false
            referencedRelation: "diretorias"
            referencedColumns: ["id"]
          }
        ]
      }
      especialidades: {
        Row: {
          id: string
          nome: string
          area_id: string
          descricao: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nome: string
          area_id: string
          descricao?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nome?: string
          area_id?: string
          descricao?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "especialidades_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          }
        ]
      }
      colaboradores: {
        Row: {
          id: string
          nome_completo: string
          email: string | null
          documento: string | null
          diretoria_id: string | null
          area_ids: string[]
          especialidade_id: string | null
          squad_ids: string[]
          senioridade: Database["public"]["Enums"]["senioridade_enum"]
          status: Database["public"]["Enums"]["status_enum"]
          data_admissao: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nome_completo: string
          email?: string | null
          documento?: string | null
          diretoria_id?: string | null
          area_ids?: string[]
          especialidade_id?: string | null
          squad_ids?: string[]
          senioridade: Database["public"]["Enums"]["senioridade_enum"]
          status?: Database["public"]["Enums"]["status_enum"]
          data_admissao: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nome_completo?: string
          email?: string | null
          documento?: string | null
          diretoria_id?: string | null
          area_ids?: string[]
          especialidade_id?: string | null
          squad_ids?: string[]
          senioridade?: Database["public"]["Enums"]["senioridade_enum"]
          status?: Database["public"]["Enums"]["status_enum"]
          data_admissao?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "colaboradores_diretoria_id_fkey"
            columns: ["diretoria_id"]
            isOneToOne: false
            referencedRelation: "diretorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "colaboradores_especialidade_id_fkey"
            columns: ["especialidade_id"]
            isOneToOne: false
            referencedRelation: "especialidades"
            referencedColumns: ["id"]
          }
        ]
      }
      contratos: {
        Row: {
          id: string
          nome: string
          cliente: string
          valor_total: number | null
          data_inicio: string
          data_fim: string | null
          status: string
          descricao: string | null
          torres: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nome: string
          cliente: string
          valor_total?: number | null
          data_inicio: string
          data_fim?: string | null
          status?: string
          descricao?: string | null
          torres?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nome?: string
          cliente?: string
          valor_total?: number | null
          data_inicio?: string
          data_fim?: string | null
          status?: string
          descricao?: string | null
          torres?: string[]
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      torres: {
        Row: {
          id: string
          nome: string
          responsavel_negocio: string | null
          head_tecnologia: string | null
          head_produto: string | null
          gerente_produto: string | null
          gerente_design: string | null
          descricao: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nome: string
          responsavel_negocio?: string | null
          head_tecnologia?: string | null
          head_produto?: string | null
          gerente_produto?: string | null
          gerente_design?: string | null
          descricao?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nome?: string
          responsavel_negocio?: string | null
          head_tecnologia?: string | null
          head_produto?: string | null
          gerente_produto?: string | null
          gerente_design?: string | null
          descricao?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      squads: {
        Row: {
          id: string
          nome: string
          torre_id: string
          contrato_id: string | null
          lider: string | null
          membros: string[]
          descricao: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nome: string
          torre_id: string
          contrato_id?: string | null
          lider?: string | null
          membros?: string[]
          descricao?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nome?: string
          torre_id?: string
          contrato_id?: string | null
          lider?: string | null
          membros?: string[]
          descricao?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "squads_torre_id_fkey"
            columns: ["torre_id"]
            isOneToOne: false
            referencedRelation: "torres"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "squads_contrato_id_fkey"
            columns: ["contrato_id"]
            isOneToOne: false
            referencedRelation: "contratos"
            referencedColumns: ["id"]
          }
        ]
      }
      alocacoes: {
        Row: {
          id: string
          colaborador_id: string
          scope: Database["public"]["Enums"]["scope_enum"]
          especialidade_id: string | null
          area_id: string | null
          diretoria_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          colaborador_id: string
          scope: Database["public"]["Enums"]["scope_enum"]
          especialidade_id?: string | null
          area_id?: string | null
          diretoria_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          colaborador_id?: string
          scope?: Database["public"]["Enums"]["scope_enum"]
          especialidade_id?: string | null
          area_id?: string | null
          diretoria_id?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "alocacoes_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alocacoes_especialidade_id_fkey"
            columns: ["especialidade_id"]
            isOneToOne: false
            referencedRelation: "especialidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alocacoes_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alocacoes_diretoria_id_fkey"
            columns: ["diretoria_id"]
            isOneToOne: false
            referencedRelation: "diretorias"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      alocacoes_expandidas: {
        Row: {
          alocacao_id: string
          colaborador_id: string
          nome_completo: string
          senioridade: Database["public"]["Enums"]["senioridade_enum"]
          scope: Database["public"]["Enums"]["scope_enum"]
          especialidade_id: string | null
          especialidade_nome: string | null
          area_id: string | null
          area_nome: string | null
          diretoria_id: string | null
          diretoria_nome: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_subordinados: {
        Args: { p_gestor_id: string }
        Returns: {
          colaborador_id: string
          nome_completo: string
          senioridade: Database["public"]["Enums"]["senioridade_enum"]
          via_scope: string
          via_id: string | null
          via_nome: string | null
        }[]
      }
      get_caminho_colaborador: {
        Args: { p_colaborador_id: string }
        Returns: {
          caminho: string
          gestor_id: string | null
          gestor_nome: string | null
          gestor_senioridade: Database["public"]["Enums"]["senioridade_enum"] | null
        }[]
      }
    }
    Enums: {
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
      scope_enum: "especialidade" | "area" | "diretoria"
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
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends { Row: infer R }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends { Row: infer R }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends { Insert: infer I }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends { Insert: infer I }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends { Update: infer U }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends { Update: infer U }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      senioridade_enum: [
        "C-level", "Diretor(a)", "Head", "Gerente", "Coordenador(a)",
        "Staf I", "Staf II", "Analista senior", "Analista pleno", "Analista junior",
      ],
      status_enum: ["Ativo", "Desligado"],
      scope_enum: ["especialidade", "area", "diretoria"],
    },
  },
} as const
