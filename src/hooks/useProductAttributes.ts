/**
 * useProductAttributes Hook
 * 
 * Manages product attributes and their translations
 * Used for variant management (Size, Color, etc.)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ProductAttribute {
  id: string;
  name: string;
  type: string; // 'select', 'text', etc.
  created_at: string;
  updated_at: string;
}

export interface ProductAttributeTranslation {
  id: string;
  attribute_id: string;
  language_code: string;
  name: string;
}

export interface ProductAttributeValue {
  id: string;
  attribute_id: string;
  value: string;
  created_at: string;
}

export interface ProductAttributeValueTranslation {
  id: string;
  value_id: string;
  language_code: string;
  value: string;
}

/**
 * Hook to manage product attributes
 */
export const useProductAttributes = () => {
  const queryClient = useQueryClient();

  /**
   * Fetch all product attributes
   */
  const { data: attributes, isLoading: loadingAttributes } = useQuery({
    queryKey: ['product-attributes'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('product_attributes')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      return (data || []) as ProductAttribute[];
    },
  });

  /**
   * Fetch attribute with translations
   */
  const getAttributeWithTranslations = async (attributeId: string) => {
    const { data: attr } = await (supabase as any)
      .from('product_attributes')
      .select('*')
      .eq('id', attributeId)
      .single();

    const { data: translations } = await (supabase as any)
      .from('product_attribute_translations')
      .select('*')
      .eq('attribute_id', attributeId);

    return { attribute: attr, translations: translations || [] };
  };

  /**
   * Create new product attribute
   */
  const createAttribute = useMutation({
    mutationFn: async (data: {
      name: string;
      type: string;
      translations?: Record<string, { name: string }>;
    }) => {
      // Create attribute
      const { data: attr, error: attrError } = await (supabase as any)
        .from('product_attributes')
        .insert([{ name: data.name, type: data.type }])
        .select()
        .single();

      if (attrError) throw attrError;

      // Create translations if provided
      if (data.translations && Object.keys(data.translations).length > 0) {
        const translationRows = Object.entries(data.translations).map(
          ([langCode, trans]) => ({
            attribute_id: attr.id,
            language_code: langCode,
            name: trans.name,
          })
        );

        const { error: transError } = await (supabase as any)
          .from('product_attribute_translations')
          .insert(translationRows);

        if (transError) throw transError;
      }

      queryClient.invalidateQueries({ queryKey: ['product-attributes'] });
      return attr;
    },
  });

  /**
   * Update product attribute
   */
  const updateAttribute = useMutation({
    mutationFn: async (data: {
      id: string;
      name?: string;
      type?: string;
      translations?: Record<string, { name: string }>;
    }) => {
      // Update attribute
      if (data.name || data.type) {
        const { error: attrError } = await (supabase as any)
          .from('product_attributes')
          .update({
            ...(data.name && { name: data.name }),
            ...(data.type && { type: data.type }),
          })
          .eq('id', data.id);

        if (attrError) throw attrError;
      }

      // Update translations if provided
      if (data.translations && Object.keys(data.translations).length > 0) {
        for (const [langCode, trans] of Object.entries(data.translations)) {
          const { error: transError } = await (supabase as any)
            .from('product_attribute_translations')
            .upsert({
              attribute_id: data.id,
              language_code: langCode,
              name: trans.name,
            });

          if (transError) throw transError;
        }
      }

      queryClient.invalidateQueries({ queryKey: ['product-attributes'] });
      return data;
    },
  });

  /**
   * Delete product attribute
   */
  const deleteAttribute = useMutation({
    mutationFn: async (attributeId: string) => {
      const { error } = await (supabase as any)
        .from('product_attributes')
        .delete()
        .eq('id', attributeId);

      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['product-attributes'] });
    },
  });

  return {
    // Data
    attributes: attributes || [],
    loadingAttributes,

    // Functions
    getAttributeWithTranslations,

    // Mutations
    createAttribute,
    updateAttribute,
    deleteAttribute,
  };
};

/**
 * Hook to manage attribute values
 */
export const useAttributeValues = (attributeId: string) => {
  const queryClient = useQueryClient();

  /**
   * Fetch values for an attribute
   */
  const { data: values, isLoading: loadingValues } = useQuery({
    queryKey: ['attribute-values', attributeId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('product_attribute_values')
        .select('*')
        .eq('attribute_id', attributeId)
        .order('value', { ascending: true });

      if (error) throw error;
      return (data || []) as ProductAttributeValue[];
    },
    enabled: !!attributeId,
  });

  /**
   * Get value with translations
   */
  const getValueWithTranslations = async (valueId: string) => {
    const { data: value } = await (supabase as any)
      .from('product_attribute_values')
      .select('*')
      .eq('id', valueId)
      .single();

    const { data: translations } = await (supabase as any)
      .from('product_attribute_value_translations')
      .select('*')
      .eq('value_id', valueId);

    return { value, translations: translations || [] };
  };

  /**
   * Create attribute value
   */
  const createValue = useMutation({
    mutationFn: async (data: {
      value: string;
      translations?: Record<string, { value: string }>;
    }) => {
      // Create value
      const { data: val, error: valError } = await (supabase as any)
        .from('product_attribute_values')
        .insert([{ attribute_id: attributeId, value: data.value }])
        .select()
        .single();

      if (valError) throw valError;

      // Create translations if provided
      if (data.translations && Object.keys(data.translations).length > 0) {
        const translationRows = Object.entries(data.translations).map(
          ([langCode, trans]) => ({
            value_id: val.id,
            language_code: langCode,
            value: trans.value,
          })
        );

        const { error: transError } = await (supabase as any)
          .from('product_attribute_value_translations')
          .insert(translationRows);

        if (transError) throw transError;
      }

      queryClient.invalidateQueries({
        queryKey: ['attribute-values', attributeId],
      });
      return val;
    },
  });

  /**
   * Update attribute value
   */
  const updateValue = useMutation({
    mutationFn: async (data: {
      id: string;
      value?: string;
      translations?: Record<string, { value: string }>;
    }) => {
      // Update value
      if (data.value) {
        const { error: valError } = await (supabase as any)
          .from('product_attribute_values')
          .update({ value: data.value })
          .eq('id', data.id);

        if (valError) throw valError;
      }

      // Update translations
      if (data.translations && Object.keys(data.translations).length > 0) {
        for (const [langCode, trans] of Object.entries(data.translations)) {
          const { error: transError } = await (supabase as any)
            .from('product_attribute_value_translations')
            .upsert({
              value_id: data.id,
              language_code: langCode,
              value: trans.value,
            });

          if (transError) throw transError;
        }
      }

      queryClient.invalidateQueries({
        queryKey: ['attribute-values', attributeId],
      });
      return data;
    },
  });

  /**
   * Delete attribute value
   */
  const deleteValue = useMutation({
    mutationFn: async (valueId: string) => {
      const { error } = await (supabase as any)
        .from('product_attribute_values')
        .delete()
        .eq('id', valueId);

      if (error) throw error;
      queryClient.invalidateQueries({
        queryKey: ['attribute-values', attributeId],
      });
    },
  });

  return {
    // Data
    values: values || [],
    loadingValues,

    // Functions
    getValueWithTranslations,

    // Mutations
    createValue,
    updateValue,
    deleteValue,
  };
};

export default useProductAttributes;
