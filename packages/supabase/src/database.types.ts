export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          operationName?: string;
          query?: string;
          variables?: Json;
          extensions?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      accounts: {
        Row: {
          created_at: string | null;
          created_by: string | null;
          email: string | null;
          id: string;
          name: string;
          picture_url: string | null;
          public_data: Json;
          updated_at: string | null;
          updated_by: string | null;
        };
        Insert: {
          created_at?: string | null;
          created_by?: string | null;
          email?: string | null;
          id?: string;
          name: string;
          picture_url?: string | null;
          public_data?: Json;
          updated_at?: string | null;
          updated_by?: string | null;
        };
        Update: {
          created_at?: string | null;
          created_by?: string | null;
          email?: string | null;
          id?: string;
          name?: string;
          picture_url?: string | null;
          public_data?: Json;
          updated_at?: string | null;
          updated_by?: string | null;
        };
        Relationships: [];
      };
      monitors: {
        Row: {
          id: string;
          name: string;
          url: string;
          type: string;
          status: string;
          interval: number;
          timeout: number;
          expected_status: number | null;
          created_at: string;
          updated_at: string;
          user_id: string;
          team_id: string | null;
          last_checked_at: string | null;
          last_response_time: number | null;
          uptime_24h: number | null;
          uptime_7d: number | null;
          uptime_30d: number | null;
          ssl_expiry_date: string | null;
          notifications_enabled: boolean | null;
          notification_channels: Json | null;
        };
        Insert: {
          id?: string;
          name: string;
          url: string;
          type: string;
          status?: string;
          interval?: number;
          timeout?: number;
          expected_status?: number | null;
          created_at?: string;
          updated_at?: string;
          user_id: string;
          team_id?: string | null;
          last_checked_at?: string | null;
          last_response_time?: number | null;
          uptime_24h?: number | null;
          uptime_7d?: number | null;
          uptime_30d?: number | null;
          ssl_expiry_date?: string | null;
          notifications_enabled?: boolean | null;
          notification_channels?: Json | null;
        };
        Update: {
          id?: string;
          name?: string;
          url?: string;
          type?: string;
          status?: string;
          interval?: number;
          timeout?: number;
          expected_status?: number | null;
          created_at?: string;
          updated_at?: string;
          user_id?: string;
          team_id?: string | null;
          last_checked_at?: string | null;
          last_response_time?: number | null;
          uptime_24h?: number | null;
          uptime_7d?: number | null;
          uptime_30d?: number | null;
          ssl_expiry_date?: string | null;
          notifications_enabled?: boolean | null;
          notification_channels?: Json | null;
        };
        Relationships: [];
      };
      health_checks: {
        Row: {
          id: string;
          monitor_id: string;
          status: string;
          response_time: number;
          status_code: number | null;
          timestamp: string;
          error: string | null;
          location: string;
        };
        Insert: {
          id?: string;
          monitor_id: string;
          status: string;
          response_time: number;
          status_code?: number | null;
          timestamp?: string;
          error?: string | null;
          location?: string;
        };
        Update: {
          id?: string;
          monitor_id?: string;
          status?: string;
          response_time?: number;
          status_code?: number | null;
          timestamp?: string;
          error?: string | null;
          location?: string;
        };
        Relationships: [];
      };
      incidents: {
        Row: {
          id: string;
          monitor_id: string;
          title: string;
          description: string | null;
          status: string;
          severity: string;
          started_at: string;
          resolved_at: string | null;
          acknowledged_at: string | null;
          acknowledged_by: string | null;
          root_cause: string | null;
          affected_monitors: string[] | null;
        };
        Insert: {
          id?: string;
          monitor_id: string;
          title: string;
          description?: string | null;
          status?: string;
          severity: string;
          started_at?: string;
          resolved_at?: string | null;
          acknowledged_at?: string | null;
          acknowledged_by?: string | null;
          root_cause?: string | null;
          affected_monitors?: string[] | null;
        };
        Update: {
          id?: string;
          monitor_id?: string;
          title?: string;
          description?: string | null;
          status?: string;
          severity?: string;
          started_at?: string;
          resolved_at?: string | null;
          acknowledged_at?: string | null;
          acknowledged_by?: string | null;
          root_cause?: string | null;
          affected_monitors?: string[] | null;
        };
        Relationships: [];
      };
      incident_updates: {
        Row: {
          id: string;
          incident_id: string;
          message: string;
          status: string;
          created_at: string;
          created_by: string;
        };
        Insert: {
          id?: string;
          incident_id: string;
          message: string;
          status: string;
          created_at?: string;
          created_by: string;
        };
        Update: {
          id?: string;
          incident_id?: string;
          message?: string;
          status?: string;
          created_at?: string;
          created_by?: string;
        };
        Relationships: [];
      };
      alerts: {
        Row: {
          id: string;
          monitor_id: string;
          incident_id: string | null;
          type: string;
          severity: string;
          status: string;
          message: string;
          created_at: string;
          acknowledged_at: string | null;
          acknowledged_by: string | null;
          resolved_at: string | null;
        };
        Insert: {
          id?: string;
          monitor_id: string;
          incident_id?: string | null;
          type: string;
          severity: string;
          status?: string;
          message: string;
          created_at?: string;
          acknowledged_at?: string | null;
          acknowledged_by?: string | null;
          resolved_at?: string | null;
        };
        Update: {
          id?: string;
          monitor_id?: string;
          incident_id?: string | null;
          type?: string;
          severity?: string;
          status?: string;
          message?: string;
          created_at?: string;
          acknowledged_at?: string | null;
          acknowledged_by?: string | null;
          resolved_at?: string | null;
        };
        Relationships: [];
      };
      teams: {
        Row: {
          id: string;
          name: string;
          slug: string;
          created_at: string;
          owner_id: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          created_at?: string;
          owner_id: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          created_at?: string;
          owner_id?: string;
        };
        Relationships: [];
      };
      team_members: {
        Row: {
          id: string;
          user_id: string;
          team_id: string;
          role: string;
          joined_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          team_id: string;
          role: string;
          joined_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          team_id?: string;
          role?: string;
          joined_at?: string;
        };
        Relationships: [];
      };
      status_pages: {
        Row: {
          id: string;
          team_id: string;
          slug: string;
          title: string;
          description: string | null;
          logo_url: string | null;
          is_public: boolean | null;
          custom_domain: string | null;
          selected_monitors: string[] | null;
          incident_history_days: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          slug: string;
          title: string;
          description?: string | null;
          logo_url?: string | null;
          is_public?: boolean | null;
          custom_domain?: string | null;
          selected_monitors?: string[] | null;
          incident_history_days?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          team_id?: string;
          slug?: string;
          title?: string;
          description?: string | null;
          logo_url?: string | null;
          is_public?: boolean | null;
          custom_domain?: string | null;
          selected_monitors?: string[] | null;
          incident_history_days?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      notification_channels: {
        Row: {
          id: string;
          team_id: string;
          type: string;
          name: string;
          enabled: boolean | null;
          config: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          type: string;
          name: string;
          enabled?: boolean | null;
          config?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          team_id?: string;
          type?: string;
          name?: string;
          enabled?: boolean | null;
          config?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  storage: {
    Tables: {
      buckets: {
        Row: {
          allowed_mime_types: string[] | null;
          avif_autodetection: boolean | null;
          created_at: string | null;
          file_size_limit: number | null;
          id: string;
          name: string;
          owner: string | null;
          owner_id: string | null;
          public: boolean | null;
          updated_at: string | null;
        };
        Insert: {
          allowed_mime_types?: string[] | null;
          avif_autodetection?: boolean | null;
          created_at?: string | null;
          file_size_limit?: number | null;
          id: string;
          name: string;
          owner?: string | null;
          owner_id?: string | null;
          public?: boolean | null;
          updated_at?: string | null;
        };
        Update: {
          allowed_mime_types?: string[] | null;
          avif_autodetection?: boolean | null;
          created_at?: string | null;
          file_size_limit?: number | null;
          id?: string;
          name?: string;
          owner?: string | null;
          owner_id?: string | null;
          public?: boolean | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      migrations: {
        Row: {
          executed_at: string | null;
          hash: string;
          id: number;
          name: string;
        };
        Insert: {
          executed_at?: string | null;
          hash: string;
          id: number;
          name: string;
        };
        Update: {
          executed_at?: string | null;
          hash?: string;
          id?: number;
          name?: string;
        };
        Relationships: [];
      };
      objects: {
        Row: {
          bucket_id: string | null;
          created_at: string | null;
          id: string;
          last_accessed_at: string | null;
          metadata: Json | null;
          name: string | null;
          owner: string | null;
          owner_id: string | null;
          path_tokens: string[] | null;
          updated_at: string | null;
          user_metadata: Json | null;
          version: string | null;
        };
        Insert: {
          bucket_id?: string | null;
          created_at?: string | null;
          id?: string;
          last_accessed_at?: string | null;
          metadata?: Json | null;
          name?: string | null;
          owner?: string | null;
          owner_id?: string | null;
          path_tokens?: string[] | null;
          updated_at?: string | null;
          user_metadata?: Json | null;
          version?: string | null;
        };
        Update: {
          bucket_id?: string | null;
          created_at?: string | null;
          id?: string;
          last_accessed_at?: string | null;
          metadata?: Json | null;
          name?: string | null;
          owner?: string | null;
          owner_id?: string | null;
          path_tokens?: string[] | null;
          updated_at?: string | null;
          user_metadata?: Json | null;
          version?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'objects_bucketId_fkey';
            columns: ['bucket_id'];
            isOneToOne: false;
            referencedRelation: 'buckets';
            referencedColumns: ['id'];
          },
        ];
      };
      s3_multipart_uploads: {
        Row: {
          bucket_id: string;
          created_at: string;
          id: string;
          in_progress_size: number;
          key: string;
          owner_id: string | null;
          upload_signature: string;
          user_metadata: Json | null;
          version: string;
        };
        Insert: {
          bucket_id: string;
          created_at?: string;
          id: string;
          in_progress_size?: number;
          key: string;
          owner_id?: string | null;
          upload_signature: string;
          user_metadata?: Json | null;
          version: string;
        };
        Update: {
          bucket_id?: string;
          created_at?: string;
          id?: string;
          in_progress_size?: number;
          key?: string;
          owner_id?: string | null;
          upload_signature?: string;
          user_metadata?: Json | null;
          version?: string;
        };
        Relationships: [
          {
            foreignKeyName: 's3_multipart_uploads_bucket_id_fkey';
            columns: ['bucket_id'];
            isOneToOne: false;
            referencedRelation: 'buckets';
            referencedColumns: ['id'];
          },
        ];
      };
      s3_multipart_uploads_parts: {
        Row: {
          bucket_id: string;
          created_at: string;
          etag: string;
          id: string;
          key: string;
          owner_id: string | null;
          part_number: number;
          size: number;
          upload_id: string;
          version: string;
        };
        Insert: {
          bucket_id: string;
          created_at?: string;
          etag: string;
          id?: string;
          key: string;
          owner_id?: string | null;
          part_number: number;
          size?: number;
          upload_id: string;
          version: string;
        };
        Update: {
          bucket_id?: string;
          created_at?: string;
          etag?: string;
          id?: string;
          key?: string;
          owner_id?: string | null;
          part_number?: number;
          size?: number;
          upload_id?: string;
          version?: string;
        };
        Relationships: [
          {
            foreignKeyName: 's3_multipart_uploads_parts_bucket_id_fkey';
            columns: ['bucket_id'];
            isOneToOne: false;
            referencedRelation: 'buckets';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 's3_multipart_uploads_parts_upload_id_fkey';
            columns: ['upload_id'];
            isOneToOne: false;
            referencedRelation: 's3_multipart_uploads';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      can_insert_object: {
        Args: {
          bucketid: string;
          name: string;
          owner: string;
          metadata: Json;
        };
        Returns: undefined;
      };
      extension: {
        Args: {
          name: string;
        };
        Returns: string;
      };
      filename: {
        Args: {
          name: string;
        };
        Returns: string;
      };
      foldername: {
        Args: {
          name: string;
        };
        Returns: string[];
      };
      get_size_by_bucket: {
        Args: Record<PropertyKey, never>;
        Returns: {
          size: number;
          bucket_id: string;
        }[];
      };
      list_multipart_uploads_with_delimiter: {
        Args: {
          bucket_id: string;
          prefix_param: string;
          delimiter_param: string;
          max_keys?: number;
          next_key_token?: string;
          next_upload_token?: string;
        };
        Returns: {
          key: string;
          id: string;
          created_at: string;
        }[];
      };
      list_objects_with_delimiter: {
        Args: {
          bucket_id: string;
          prefix_param: string;
          delimiter_param: string;
          max_keys?: number;
          start_after?: string;
          next_token?: string;
        };
        Returns: {
          name: string;
          id: string;
          metadata: Json;
          updated_at: string;
        }[];
      };
      operation: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      search: {
        Args: {
          prefix: string;
          bucketname: string;
          limits?: number;
          levels?: number;
          offsets?: number;
          search?: string;
          sortcolumn?: string;
          sortorder?: string;
        };
        Returns: {
          name: string;
          id: string;
          updated_at: string;
          created_at: string;
          last_accessed_at: string;
          metadata: Json;
        }[];
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type PublicSchema = Database[Extract<keyof Database, 'public'>];

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema['Tables'] & PublicSchema['Views'])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions['schema']]['Tables'] &
        Database[PublicTableNameOrOptions['schema']]['Views'])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions['schema']]['Tables'] &
      Database[PublicTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema['Tables'] &
        PublicSchema['Views'])
    ? (PublicSchema['Tables'] &
        PublicSchema['Views'])[PublicTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema['Tables']
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema['Tables']
    ? PublicSchema['Tables'][PublicTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema['Tables']
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema['Tables']
    ? PublicSchema['Tables'][PublicTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema['Enums']
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions['schema']]['Enums'][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema['Enums']
    ? PublicSchema['Enums'][PublicEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema['CompositeTypes']
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema['CompositeTypes']
    ? PublicSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;
