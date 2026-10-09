-- Migration 002: Add multilingual language column and update unique constraint on cms_sections

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cms_sections' AND column_name = 'language'
    ) THEN
        ALTER TABLE cms_sections ADD COLUMN language VARCHAR(10) NOT NULL DEFAULT 'en';
        ALTER TABLE cms_sections DROP CONSTRAINT IF EXISTS cms_sections_page_id_section_key_unique;
        ALTER TABLE cms_sections ADD CONSTRAINT cms_sections_page_id_section_key_language_unique UNIQUE (page_id, section_key, language);
    END IF;
END $$;
