DO $$
DECLARE
    new_uuid text;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE LAVAMANOS ECO 40X30')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE LAVAMANOS ECO 40X30', 'Marmol_sintetico', 'GEN-2EB8A684');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE MESON ECO 150X55 MATE SIN PERF')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE MESON ECO 150X55 MATE SIN PERF', 'Marmol_sintetico', 'GEN-05819E74');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE LAVARROPAS ECO 46X51')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE LAVARROPAS ECO 46X51', 'Marmol_sintetico', 'GEN-C1DE1845');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE LAVARROPAS 48X51W BRILLANTE')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE LAVARROPAS 48X51W BRILLANTE', 'Marmol_sintetico', 'GEN-8C6AF768');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE LAVAMANOS OSLO 155X48')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE LAVAMANOS OSLO 155X48', 'Marmol_sintetico', 'GEN-B04961ED');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE MESON ECO 120X55 BRILLANTE')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE MESON ECO 120X55 BRILLANTE', 'Marmol_sintetico', 'GEN-FC12C1E4');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE LAVARROPAS ECO 60X60')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE LAVARROPAS ECO 60X60', 'Marmol_sintetico', 'GEN-3B4E69B6');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE LAVAMANOS TRENTINO 63X48 BRILLANTE')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE LAVAMANOS TRENTINO 63X48 BRILLANTE', 'Marmol_sintetico', 'GEN-4ADC5F50');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE MESON ECO 150X55 BRILLANTE SIN PERF')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE MESON ECO 150X55 BRILLANTE SIN PERF', 'Marmol_sintetico', 'GEN-5425514E');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE LAVAMANOS OSLO 94X48')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE LAVAMANOS OSLO 94X48', 'Marmol_sintetico', 'GEN-D7BB2218');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE LAVARROPAS AQUA 60X60 BRILLANTE')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE LAVARROPAS AQUA 60X60 BRILLANTE', 'Marmol_sintetico', 'GEN-19A40D65');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE LAVAMANOS SIENA 63x48')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE LAVAMANOS SIENA 63x48', 'Marmol_sintetico', 'GEN-C759BCBA');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE LAVAMANOS SIENA 79x48')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE LAVAMANOS SIENA 79x48', 'Marmol_sintetico', 'GEN-608502CA');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE LAVAMANOS OSLO 48X38')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE LAVAMANOS OSLO 48X38', 'Marmol_sintetico', 'GEN-B429CCB6');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE MESON ECO 150X55 BRILLANTE PERF CUBIERTA')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE MESON ECO 150X55 BRILLANTE PERF CUBIERTA', 'Marmol_sintetico', 'GEN-608EA488');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE LAVAMANOS JOHAN VESSEL 50X40 BRILLANTE')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE LAVAMANOS JOHAN VESSEL 50X40 BRILLANTE', 'Marmol_sintetico', 'GEN-695DB1CA');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE LAVARROPAS AQUA 80X60 BRILLANTE')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE LAVARROPAS AQUA 80X60 BRILLANTE', 'Marmol_sintetico', 'GEN-D16B5BB1');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE LAVAMANOS ECO 48X38')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE LAVAMANOS ECO 48X38', 'Marmol_sintetico', 'GEN-9931DC34');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE LAVARROPAS VERSA 55X50')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE LAVARROPAS VERSA 55X50', 'Marmol_sintetico', 'GEN-20CE85FA');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE LAVAMANOS BARI 63X48')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE LAVAMANOS BARI 63X48', 'Marmol_sintetico', 'GEN-48D0AD05');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE LAVAMANOS OSLO 63X48')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE LAVAMANOS OSLO 63X48', 'Marmol_sintetico', 'GEN-FB0C5300');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE LAVATRAPEROS PRO 46X36')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE LAVATRAPEROS PRO 46X36', 'Marmol_sintetico', 'GEN-655A7375');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE LAVARROPAS ECO 80X60')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE LAVARROPAS ECO 80X60', 'Marmol_sintetico', 'GEN-B5CA732B');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE LAVARROPAS AQUA 48X60 BRILLANTE')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE LAVARROPAS AQUA 48X60 BRILLANTE', 'Marmol_sintetico', 'GEN-5CE0058F');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE LAVAMANOS OSLO 48X43')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE LAVAMANOS OSLO 48X43', 'Marmol_sintetico', 'GEN-5F601972');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE MESON COCINA 180X60 PERF-CUB V.2')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE MESON COCINA 180X60 PERF-CUB V.2', 'Marmol_sintetico', 'GEN-93964F52');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE LAVARROPAS AQUA 90X60 BRILLANTE')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE LAVARROPAS AQUA 90X60 BRILLANTE', 'Marmol_sintetico', 'GEN-628587F9');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE LAVAMANOS PARMA 79X48 BRILLANTE')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE LAVAMANOS PARMA 79X48 BRILLANTE', 'Marmol_sintetico', 'GEN-FF4966D0');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE BARRA COCINA 120X55 BRILLANTE - PERF-CUB')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE BARRA COCINA 120X55 BRILLANTE - PERF-CUB', 'Marmol_sintetico', 'GEN-40174B88');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE LAVAMANOS DOHA VESSEL 45X33 BRILLANTE')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE LAVAMANOS DOHA VESSEL 45X33 BRILLANTE', 'Marmol_sintetico', 'GEN-495F52FC');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE LAVATRAPEROS AQUA 40X35 BRILLANTE')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE LAVATRAPEROS AQUA 40X35 BRILLANTE', 'Marmol_sintetico', 'GEN-26EB09C1');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE LAVARROPAS PRO DERECHO 140X60')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE LAVARROPAS PRO DERECHO 140X60', 'Marmol_sintetico', 'GEN-C26065B2');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE LAVAMANOS GENOVA 63X48')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE LAVAMANOS GENOVA 63X48', 'Marmol_sintetico', 'GEN-566352BB');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE LAVAPLATOS KOA 84X56')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE LAVAPLATOS KOA 84X56', 'Marmol_sintetico', 'GEN-4773DC3F');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE LAVAMANOS PARMA 63X48 BRILLANTE')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE LAVAMANOS PARMA 63X48 BRILLANTE', 'Marmol_sintetico', 'GEN-DF0A8C9A');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE IBIZA 182X100')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE IBIZA 182X100', 'Marmol_sintetico', 'GEN-0D413E38');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE LAVARROPAS PRO IZQUIERDO 100X60')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE LAVARROPAS PRO IZQUIERDO 100X60', 'Marmol_sintetico', 'GEN-3E6E6927');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE BAÑERA SANTORINI 180X180 V.2')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE BAÑERA SANTORINI 180X180 V.2', 'Fibra_de_vidrio', 'GEN-74B283E3');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE LAVAMANOS BARI 79X48 BRILLANTE')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE LAVAMANOS BARI 79X48 BRILLANTE', 'Marmol_sintetico', 'GEN-23D273DF');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE MESON COCINA 180X60 SIN PERF-CUB V.2')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE MESON COCINA 180X60 SIN PERF-CUB V.2', 'Marmol_sintetico', 'GEN-36D58178');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE LAVARROPAS ECO 70X60')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE LAVARROPAS ECO 70X60', 'Marmol_sintetico', 'GEN-092A061D');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE LAVARROPAS ECO 48X60')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE LAVARROPAS ECO 48X60', 'Marmol_sintetico', 'GEN-38AF6EBE');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE LAVAMANOS QUADRATTO 48X43 BRILLANTE')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE LAVAMANOS QUADRATTO 48X43 BRILLANTE', 'Marmol_sintetico', 'GEN-839762B6');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE LAVAMANOS OSLO 79X48')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE LAVAMANOS OSLO 79X48', 'Marmol_sintetico', 'GEN-7F8B9EE8');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE MESON COCINA 150X60 V.2 - PERF-CUB')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE MESON COCINA 150X60 V.2 - PERF-CUB', 'Marmol_sintetico', 'GEN-B59A191B');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE LAVAMANOS SIENA 124x48')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE LAVAMANOS SIENA 124x48', 'Marmol_sintetico', 'GEN-EEB30178');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE LAVAPLATOS KOA 63X51 1 BOWL')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE LAVAPLATOS KOA 63X51 1 BOWL', 'Marmol_sintetico', 'GEN-2D2C0B23');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE LAVARROPAS 50X50 BRILLANTE')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE LAVARROPAS 50X50 BRILLANTE', 'Marmol_sintetico', 'GEN-83DCDE4B');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE LAVARROPAS VERSA 50X50 BRILLANTE')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE LAVARROPAS VERSA 50X50 BRILLANTE', 'Marmol_sintetico', 'GEN-3790B9C9');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE LAVAMANOS RIO 48X43 BRILLANTE')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE LAVAMANOS RIO 48X43 BRILLANTE', 'Marmol_sintetico', 'GEN-703F1DB0');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE LAVAMANOS GENOVA 79X48')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE LAVAMANOS GENOVA 79X48', 'Marmol_sintetico', 'GEN-5B941C1E');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE LAVARROPAS PRO DERECHO 100X60')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE LAVARROPAS PRO DERECHO 100X60', 'Marmol_sintetico', 'GEN-7886BA0A');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE MESON COCINA 150X60 V.2 SIN PERF')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE MESON COCINA 150X60 V.2 SIN PERF', 'Marmol_sintetico', 'GEN-DAC121DD');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE MESON LAVAMANOS OASIS 63X48 BRILLANTE')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE MESON LAVAMANOS OASIS 63X48 BRILLANTE', 'Marmol_sintetico', 'GEN-EF169643');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE LAVAMANOS MECA VESSEL 35X35 BRILLANTE')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE LAVAMANOS MECA VESSEL 35X35 BRILLANTE', 'Marmol_sintetico', 'GEN-FF16CFD7');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE LAVAMANOS MECA VESSEL 35X35 SOFT MATE')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE LAVAMANOS MECA VESSEL 35X35 SOFT MATE', 'Marmol_sintetico', 'GEN-31751367');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE LAVARROPAS PRO 60X60')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE LAVARROPAS PRO 60X60', 'Marmol_sintetico', 'GEN-4DA5F2F0');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE LAVAMANOS GENOVA 94X48')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE LAVAMANOS GENOVA 94X48', 'Marmol_sintetico', 'GEN-2AD5B27D');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE LAVAMANOS SIENA 48X43')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE LAVAMANOS SIENA 48X43', 'Marmol_sintetico', 'GEN-98598FE7');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE MESA DE TRABAJO PRO-MESON 140X60')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE MESA DE TRABAJO PRO-MESON 140X60', 'Marmol_sintetico', 'GEN-035B5126');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE LAVAMANOS GENOVA 124X48')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE LAVAMANOS GENOVA 124X48', 'Marmol_sintetico', 'GEN-3B1964A7');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE LAVAMANOS QUADRATTO 63X48 BRILLANTE')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE LAVAMANOS QUADRATTO 63X48 BRILLANTE', 'Marmol_sintetico', 'GEN-21D39D53');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE LAVAMANOS QUADRATTO 94X48 BRILLANTE')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE LAVAMANOS QUADRATTO 94X48 BRILLANTE', 'Marmol_sintetico', 'GEN-DA1B2DE1');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE LAVATRAPEROS 46X46 BRILLANTE')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE LAVATRAPEROS 46X46 BRILLANTE', 'Marmol_sintetico', 'GEN-0DE0AF36');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE BAÑERA TAHITI 152X152')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE BAÑERA TAHITI 152X152', 'Fibra_de_vidrio', 'GEN-8873EB3C');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE LAVAMANOS DOHA VESSEL 45X33 SOFT MATE')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE LAVAMANOS DOHA VESSEL 45X33 SOFT MATE', 'Marmol_sintetico', 'GEN-592B5412');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE JAMAICA PLUS DERECHA 152X75')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE JAMAICA PLUS DERECHA 152X75', 'Fibra_de_vidrio', 'GEN-30015A58');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE MOBU 200')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE MOBU 200', 'Fibra_de_vidrio', 'GEN-AAA7DAC5');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE LAVAMANOS OSLO 124X48')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE LAVAMANOS OSLO 124X48', 'Marmol_sintetico', 'GEN-543A9EBF');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE PLAQUITA PARA LVM GENOVA 94X48')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE PLAQUITA PARA LVM GENOVA 94X48', 'Marmol_sintetico', 'GEN-B1AAC56E');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE LAVAMANOS BARI 94X48')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE LAVAMANOS BARI 94X48', 'Marmol_sintetico', 'GEN-0CCDEBF6');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE DANESA 189X113X45')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE DANESA 189X113X45', 'Fibra_de_vidrio', 'GEN-8F8E853C');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE BAÑERA CATALUÑA 170X90')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE BAÑERA CATALUÑA 170X90', 'Fibra_de_vidrio', 'GEN-9AAFD23D');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE LAVARROPAS PRO IZQUIERDO 140X60')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE LAVARROPAS PRO IZQUIERDO 140X60', 'Marmol_sintetico', 'GEN-CFCCA407');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE HONOLULU DERECHA 180X120')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE HONOLULU DERECHA 180X120', 'Fibra_de_vidrio', 'GEN-CCDAC9ED');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE LAVAMANOS SIENA 94X48')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE LAVAMANOS SIENA 94X48', 'Marmol_sintetico', 'GEN-F1C51FBE');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE HONOLULU IZQUIERDA 180X120')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE HONOLULU IZQUIERDA 180X120', 'Fibra_de_vidrio', 'GEN-5A42E095');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MODELO IBIZA 182X123')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MODELO IBIZA 182X123', 'Marmol_sintetico', 'GEN-4B73F384');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE MILENIUM 182X123')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE MILENIUM 182X123', 'Fibra_de_vidrio', 'GEN-2820AFBD');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE PLAQUITA PARA LVM GENOVA 63X48')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE PLAQUITA PARA LVM GENOVA 63X48', 'Marmol_sintetico', 'GEN-4C3B3FDE');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE ITALIANA ECO 150X70')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE ITALIANA ECO 150X70', 'Fibra_de_vidrio', 'GEN-36973C92');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE BARRA COCINA 120X55 BRILLANTE - SIN PERF')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE BARRA COCINA 120X55 BRILLANTE - SIN PERF', 'Marmol_sintetico', 'GEN-8896C59E');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE AMERICANA PLUS V.2')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE AMERICANA PLUS V.2', 'Fibra_de_vidrio', 'GEN-6D4269A9');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE FALDON CATALUÑA')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE FALDON CATALUÑA', 'Fibra_de_vidrio', 'GEN-DA1460B6');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE MESON COCINA VERSA 150X55 SIN PERF CUB')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE MESON COCINA VERSA 150X55 SIN PERF CUB', 'Marmol_sintetico', 'GEN-E694672A');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE PLAQUITA PARA LVM GENOVA 79X48')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE PLAQUITA PARA LVM GENOVA 79X48', 'Marmol_sintetico', 'GEN-08E97D2A');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE PLACA MUESTRAS')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE PLACA MUESTRAS', 'Marmol_sintetico', 'GEN-66A763A4');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE PLACA PARA MUESTRAS 20X20 CM')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE PLACA PARA MUESTRAS 20X20 CM', 'Marmol_sintetico', 'GEN-F3310881');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MODELO LAVAMANOS OSLO 94X48')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MODELO LAVAMANOS OSLO 94X48', 'Marmol_sintetico', 'GEN-6E600F12');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MODELO BARRA COCINA 120X55 BRILLANTE')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MODELO BARRA COCINA 120X55 BRILLANTE', 'Marmol_sintetico', 'GEN-735EC275');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MODELO LAVAMANOS ECO 48X38')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MODELO LAVAMANOS ECO 48X38', 'Marmol_sintetico', 'GEN-4E400F66');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE LAVAPLATOS MOCA 84X51 BRILLANTE')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE LAVAPLATOS MOCA 84X51 BRILLANTE', 'Marmol_sintetico', 'GEN-FD77222B');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE SALPICADERO 150X55')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE SALPICADERO 150X55', 'Marmol_sintetico', 'GEN-9E022F0E');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE SALPICADERO 180X55')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE SALPICADERO 180X55', 'Marmol_sintetico', 'GEN-F6EE1E29');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE PLACA GENOVA 124X48')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE PLACA GENOVA 124X48', 'Marmol_sintetico', 'GEN-2A8C5CFE');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE LAVAMANOS BARI 100X50')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE LAVAMANOS BARI 100X50', 'Marmol_sintetico', 'GEN-B734DA5A');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE MUESTRA COLORES')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE MUESTRA COLORES', 'Marmol_sintetico', 'GEN-922EBDC5');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE LAVAMANOS SIENA 120X51')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE LAVAMANOS SIENA 120X51', 'Marmol_sintetico', 'GEN-67D8C4F9');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE LAVAMANOS OSLO 100X50')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE LAVAMANOS OSLO 100X50', 'Marmol_sintetico', 'GEN-820DA697');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE SALPICADERO 61X10 PARA LVM')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE SALPICADERO 61X10 PARA LVM', 'Marmol_sintetico', 'GEN-0D4DF47C');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE LAVAPLATOS AMATISTA')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE LAVAPLATOS AMATISTA', 'Marmol_sintetico', 'GEN-DCF8186B');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE LAVAMANOS QUADRATTO 66X51 SIN SALPICADERO')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE LAVAMANOS QUADRATTO 66X51 SIN SALPICADERO', 'Marmol_sintetico', 'GEN-B7CC2FA6');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE MESON COCINA 151X60')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE MESON COCINA 151X60', 'Marmol_sintetico', 'GEN-47E99902');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE SALPICADERO 151X60')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE SALPICADERO 151X60', 'Marmol_sintetico', 'GEN-A816B166');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE PISO DUCHA 115X70')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE PISO DUCHA 115X70', 'Marmol_sintetico', 'GEN-926A39C0');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE COCINA MURANO 210X60 BRILLANTE')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE COCINA MURANO 210X60 BRILLANTE', 'Marmol_sintetico', 'GEN-20458CD0');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE TAPA REGISTRO 30X30 BRILLANTE')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE TAPA REGISTRO 30X30 BRILLANTE', 'Marmol_sintetico', 'GEN-F9B9C208');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE LAVAMANOS VENECIA 63X48 BRILLANTE')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE LAVAMANOS VENECIA 63X48 BRILLANTE', 'Marmol_sintetico', 'GEN-76AE29F6');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE MESON LAVAMANOS OASIS 63X48 SOFT MATE')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE MESON LAVAMANOS OASIS 63X48 SOFT MATE', 'Marmol_sintetico', 'GEN-73FB34EC');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE CAJA GRIFO NEVERA MATE')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE CAJA GRIFO NEVERA MATE', 'Marmol_sintetico', 'GEN-58AB668B');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE LAVARROPAS 60X51 MATE')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE LAVARROPAS 60X51 MATE', 'Marmol_sintetico', 'GEN-2B47C02B');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE LAVARROPAS 50X50 MATE')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE LAVARROPAS 50X50 MATE', 'Marmol_sintetico', 'GEN-690F52E2');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE CAJA GAS MULTIPLE 53X15 BRILLANTE')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE CAJA GAS MULTIPLE 53X15 BRILLANTE', 'Marmol_sintetico', 'GEN-CA64E005');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE CAJA LLAVE GAS 17X17 BRILLANTE')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE CAJA LLAVE GAS 17X17 BRILLANTE', 'Marmol_sintetico', 'GEN-0F6D3FB4');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE CAJA GRIFO NEVERA BRILLANTE')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE CAJA GRIFO NEVERA BRILLANTE', 'Marmol_sintetico', 'GEN-5253CB11');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE CAJA GRIFO LAVADORA 30X21 BRILLANTE')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE CAJA GRIFO LAVADORA 30X21 BRILLANTE', 'Marmol_sintetico', 'GEN-08BA60B3');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE LAVATRAPEROS ECO 30X30')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE LAVATRAPEROS ECO 30X30', 'Marmol_sintetico', 'GEN-F14A713B');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE LAVARROPAS 60X51 BRILLANTE')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE LAVARROPAS 60X51 BRILLANTE', 'Marmol_sintetico', 'GEN-1560FF0B');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE LAVARROPAS 46X51 BRILLANTE')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE LAVARROPAS 46X51 BRILLANTE', 'Marmol_sintetico', 'GEN-DDBF421E');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE LAVARROPAS CONSTRU 60X60 BRILLANTE')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE LAVARROPAS CONSTRU 60X60 BRILLANTE', 'Marmol_sintetico', 'GEN-4584759D');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE REPISA LAVAMANOS 63X20 BRILLANTE')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE REPISA LAVAMANOS 63X20 BRILLANTE', 'Marmol_sintetico', 'GEN-0742A562');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE REPISA LAVAMANOS 48X20 BRILLANTE')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE REPISA LAVAMANOS 48X20 BRILLANTE', 'Marmol_sintetico', 'GEN-8C8C5182');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE LAVAMANOS SAHARA 47.5X40.5 BRILLANTE')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE LAVAMANOS SAHARA 47.5X40.5 BRILLANTE', 'Marmol_sintetico', 'GEN-73A4D7C5');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE LAVAMANOS SAHARA 47.5X40.5 SOFT MATE')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE LAVAMANOS SAHARA 47.5X40.5 SOFT MATE', 'Marmol_sintetico', 'GEN-F31CE574');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE LAVAMANOS IGUAZU 40X28 BRILLANTE')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE LAVAMANOS IGUAZU 40X28 BRILLANTE', 'Marmol_sintetico', 'GEN-4C2715AB');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE LAVAMANOS QUADRATTO 79X56 BRILLANTE')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE LAVAMANOS QUADRATTO 79X56 BRILLANTE', 'Marmol_sintetico', 'GEN-A237FE3B');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE LAVAMANOS OCEAN 79X56 BRILLANTE')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE LAVAMANOS OCEAN 79X56 BRILLANTE', 'Marmol_sintetico', 'GEN-478329CA');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE LAVAMANOS OCEAN 63X48 BRILLANTE')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE LAVAMANOS OCEAN 63X48 BRILLANTE', 'Marmol_sintetico', 'GEN-3FD13ECB');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE LAVAMANOS OCEAN 63X56 BRILLANTE')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE LAVAMANOS OCEAN 63X56 BRILLANTE', 'Marmol_sintetico', 'GEN-B2A9055D');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE LAVAMANOS DAKAR 49X44 BRILLANTE')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE LAVAMANOS DAKAR 49X44 BRILLANTE', 'Marmol_sintetico', 'GEN-7FA77E0B');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE LAVAMANOS OCEAN 48X43 BRILLANTE')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE LAVAMANOS OCEAN 48X43 BRILLANTE', 'Marmol_sintetico', 'GEN-BEA96A37');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE LAVAMANOS QUADRATTO 94X56 BRILLANTE')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE LAVAMANOS QUADRATTO 94X56 BRILLANTE', 'Marmol_sintetico', 'GEN-7C00007C');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE LAVAMANOS QUADRATTO 63X56 BRILLANTE')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE LAVAMANOS QUADRATTO 63X56 BRILLANTE', 'Marmol_sintetico', 'GEN-9C42BFE6');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE LAVAMANOS QUADRATTO 79X48 BRILLANTE')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE LAVAMANOS QUADRATTO 79X48 BRILLANTE', 'Marmol_sintetico', 'GEN-625BDE42');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE LAVAMANOS BARCELONA 63X48 BRILLANTE')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE LAVAMANOS BARCELONA 63X48 BRILLANTE', 'Marmol_sintetico', 'GEN-72FB278F');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE LAVAMANOS CORAL 41X37 BRILLANTE')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE LAVAMANOS CORAL 41X37 BRILLANTE', 'Marmol_sintetico', 'GEN-96248AEC');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE LAVAMANOS ANKARA 43X43 BRILLANTE')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE LAVAMANOS ANKARA 43X43 BRILLANTE', 'Marmol_sintetico', 'GEN-C282923C');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE LAVAPLATOS ANIS 84X56 BRILLANTE')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE LAVAPLATOS ANIS 84X56 BRILLANTE', 'Marmol_sintetico', 'GEN-10ED68C2');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE LAVAPLATOS PETIT 38X38 BRILLANTE')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE LAVAPLATOS PETIT 38X38 BRILLANTE', 'Marmol_sintetico', 'GEN-5961A039');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE LAVAPLATOS MENTA 84X51 BRILLANTE')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE LAVAPLATOS MENTA 84X51 BRILLANTE', 'Marmol_sintetico', 'GEN-3DDBBC59');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE LAVAPLATOS MANZANO 84X56 BRILLANTE')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE LAVAPLATOS MANZANO 84X56 BRILLANTE', 'Marmol_sintetico', 'GEN-4408D43A');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE LAVAPLATOS LAUREL 63X56 BRILLANTE')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE LAVAPLATOS LAUREL 63X56 BRILLANTE', 'Marmol_sintetico', 'GEN-094FC170');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE LAVAPLATOS LAUREL 63X51 BRILLANTE')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE LAVAPLATOS LAUREL 63X51 BRILLANTE', 'Marmol_sintetico', 'GEN-4DDE99CF');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE LAVAPLATOS EMBASSY 100X51 BRILLANTE')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE LAVAPLATOS EMBASSY 100X51 BRILLANTE', 'Marmol_sintetico', 'GEN-43A6C3F0');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE LAVAPLATOS CEREZO 81X45 BRILLANTE')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE LAVAPLATOS CEREZO 81X45 BRILLANTE', 'Marmol_sintetico', 'GEN-4A29BD5C');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE LAVAPLATOS CARRARA 50X51 BRILLANTE')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE LAVAPLATOS CARRARA 50X51 BRILLANTE', 'Marmol_sintetico', 'GEN-18FE648A');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE LAVAPLATOS CARAMELO 81X45 BRILLANTE')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE LAVAPLATOS CARAMELO 81X45 BRILLANTE', 'Marmol_sintetico', 'GEN-31F11D97');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE LAVAPLATOS CANELO 55X43 BRILLANTE')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE LAVAPLATOS CANELO 55X43 BRILLANTE', 'Marmol_sintetico', 'GEN-BCADA29A');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE LAVAPLATOS ESPIGA 79X45 BRILLANTE')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE LAVAPLATOS ESPIGA 79X45 BRILLANTE', 'Marmol_sintetico', 'GEN-831F9857');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE PISO DE DUCHA 152X76 BRILLANTE')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE PISO DE DUCHA 152X76 BRILLANTE', 'Marmol_sintetico', 'GEN-F9F33B9B');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE MESON COCINA 180X55')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE MESON COCINA 180X55', 'Marmol_sintetico', 'GEN-8E7B1669');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE PISO DE DUCHA 90X109 BRILLANTE')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE PISO DE DUCHA 90X109 BRILLANTE', 'Marmol_sintetico', 'GEN-FD688BCE');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE LAVAPLATOS CIPRES 62X48')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE LAVAPLATOS CIPRES 62X48', 'Marmol_sintetico', 'GEN-6609FBE1');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE MESON 100X51 BRILLANTE')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE MESON 100X51 BRILLANTE', 'Marmol_sintetico', 'GEN-D1256217');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE MESON ECO 100X51 MATE')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE MESON ECO 100X51 MATE', 'Marmol_sintetico', 'GEN-B5B0F303');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE LAVAPLATOS AROMA 84X56 BRILLANTE')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE LAVAPLATOS AROMA 84X56 BRILLANTE', 'Marmol_sintetico', 'GEN-405F5093');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE LAVAPLATOS NOGAL 100X51 BRILLANTE')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE LAVAPLATOS NOGAL 100X51 BRILLANTE', 'Marmol_sintetico', 'GEN-497D46EF');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MODELO IBIZA 182X100')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MODELO IBIZA 182X100', 'Marmol_sintetico', 'GEN-C2652EC7');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MODELO MESON COCINA AQUA 150X60 V3 PERF CUBIERTA')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MODELO MESON COCINA AQUA 150X60 V3 PERF CUBIERTA', 'Marmol_sintetico', 'GEN-5C702844');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE GALAPAGOS 250X200 V.2')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE GALAPAGOS 250X200 V.2', 'Fibra_de_vidrio', 'GEN-C6A901E7');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE BAÑERA SANTORINI 180X180')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE BAÑERA SANTORINI 180X180', 'Fibra_de_vidrio', 'GEN-41F07694');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MODELO MESON COCINA 150X60 V.2 - PERF-CUB')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MODELO MESON COCINA 150X60 V.2 - PERF-CUB', 'Marmol_sintetico', 'GEN-FFFB0F29');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE ESPAÑOLA 152X75')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE ESPAÑOLA 152X75', 'Fibra_de_vidrio', 'GEN-554FD9FD');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE LAVARROPAS VIVE 60X50')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE LAVARROPAS VIVE 60X50', 'Marmol_sintetico', 'GEN-27D3A3EF');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE FRANCESA 160X90')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE FRANCESA 160X90', 'Fibra_de_vidrio', 'GEN-4FF97544');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE BONAIRE 183X152')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE BONAIRE 183X152', 'Fibra_de_vidrio', 'GEN-02C1439D');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE ZOCALO 150X8X4 RTM')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE ZOCALO 150X8X4 RTM', 'Marmol_sintetico', 'GEN-5FC3C1D3');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE FALDON BAÑERA HONOLULU DERECHA')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE FALDON BAÑERA HONOLULU DERECHA', 'Fibra_de_vidrio', 'GEN-F2BCA87C');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MODELO LAVAMANOS SIENA 94X48')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MODELO LAVAMANOS SIENA 94X48', 'Marmol_sintetico', 'GEN-C5D85AFD');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MODELO PLAQUITA PARA LVM GENOVA 63X48')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MODELO PLAQUITA PARA LVM GENOVA 63X48', 'Marmol_sintetico', 'GEN-30015975');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE FALDON SANTORINI PLUS 180x80')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE FALDON SANTORINI PLUS 180x80', 'Marmol_sintetico', 'GEN-3D60536F');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE MYDAS EMPOTRAR 182')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE MYDAS EMPOTRAR 182', 'Marmol_sintetico', 'GEN-B8C73F00');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE NORUEGA 156')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE NORUEGA 156', 'Fibra_de_vidrio', 'GEN-9261A8A2');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE BAÑERA MALTA 160X80')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE BAÑERA MALTA 160X80', 'Fibra_de_vidrio', 'GEN-09F0DFE4');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE QATAR 180X100')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE QATAR 180X100', 'Fibra_de_vidrio', 'GEN-D60CF1A0');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE FALDON DANESA')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE FALDON DANESA', 'Fibra_de_vidrio', 'GEN-3A0CC535');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE FRANCESA 180X90X42')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE FRANCESA 180X90X42', 'Fibra_de_vidrio', 'GEN-134AC151');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE FALDON BAÑERA NORUEGA')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE FALDON BAÑERA NORUEGA', 'Fibra_de_vidrio', 'GEN-D0E441F3');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE FALDON BAÑERA HONOLULU IZQUIERDA')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE FALDON BAÑERA HONOLULU IZQUIERDA', 'Fibra_de_vidrio', 'GEN-E459A02F');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE FALDON TAHITI 152X152')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE FALDON TAHITI 152X152', 'Fibra_de_vidrio', 'GEN-14734432');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE FALDON QATAR 180X100')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE FALDON QATAR 180X100', 'Fibra_de_vidrio', 'GEN-5123E018');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MODELO FALDON SANTORINI PLUS 180x80')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MODELO FALDON SANTORINI PLUS 180x80', 'Fibra_de_vidrio', 'GEN-38E15B96');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE CHATTANOOGAN 200X200')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE CHATTANOOGAN 200X200', 'Fibra_de_vidrio', 'GEN-A8936ECB');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE IBIZA 182X123')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE IBIZA 182X123', 'Fibra_de_vidrio', 'GEN-E8668D53');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE CHALLENGER 190X190')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE CHALLENGER 190X190', 'Fibra_de_vidrio', 'GEN-F2972068');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE AMERICANA PLUS IZQUIERDA 153X78')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE AMERICANA PLUS IZQUIERDA 153X78', 'Fibra_de_vidrio', 'GEN-DBCF888F');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE AMERICANA PLUS DERECHA 153X78')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE AMERICANA PLUS DERECHA 153X78', 'Fibra_de_vidrio', 'GEN-D5728425');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE JAMAICA PLUS IZQUIERDA 152X75')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE JAMAICA PLUS IZQUIERDA 152X75', 'Fibra_de_vidrio', 'GEN-60BAA9C3');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE ITALIANA ECO 140X70')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE ITALIANA ECO 140X70', 'Fibra_de_vidrio', 'GEN-59A46E0E');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE SAVANNA 170X80X40')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE SAVANNA 170X80X40', 'Fibra_de_vidrio', 'GEN-09544814');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE AMERICANA 140X78')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE AMERICANA 140X78', 'Fibra_de_vidrio', 'GEN-D9DDB17A');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MODELO MESON ECO 120X55 BRILLANTE')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MODELO MESON ECO 120X55 BRILLANTE', 'Marmol_sintetico', 'GEN-135926A5');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MODELO MESON COCINA 180X60 SIN PERF V2')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MODELO MESON COCINA 180X60 SIN PERF V2', 'Marmol_sintetico', 'GEN-45F273D1');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MODELO PLACA PARA ENSAYOS 30X20 CM')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MODELO PLACA PARA ENSAYOS 30X20 CM', 'Marmol_sintetico', 'GEN-A7A03807');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MODELO  LAVAMANOS GENOVA 124X48')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MODELO  LAVAMANOS GENOVA 124X48', 'Marmol_sintetico', 'GEN-7A49A648');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE FALDON AMERICANA PLUS')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE FALDON AMERICANA PLUS', 'Fibra_de_vidrio', 'GEN-50F2D9E0');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE FALDON AMERICANA PLUS EN L')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE FALDON AMERICANA PLUS EN L', 'Fibra_de_vidrio', 'GEN-91B4E272');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MODELO MESON COCINA RTM 180X60 V.2')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MODELO MESON COCINA RTM 180X60 V.2', 'Marmol_sintetico', 'GEN-76FAE252');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MODELO SALPICADERO 180X60 V.2')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MODELO SALPICADERO 180X60 V.2', 'Marmol_sintetico', 'GEN-7222050A');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MODELO SALPICADERO 150X60 V.2')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MODELO SALPICADERO 150X60 V.2', 'Marmol_sintetico', 'GEN-B1AD6DCE');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MODELO LAVAMANOS SIENA 155x48')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MODELO LAVAMANOS SIENA 155x48', 'Marmol_sintetico', 'GEN-5A39679B');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MODELO LAVAMANOS GENOVA 155x48')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MODELO LAVAMANOS GENOVA 155x48', 'Marmol_sintetico', 'GEN-D517EF8F');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MODELO LAVAMANOS IGUAZU 40X28')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MODELO LAVAMANOS IGUAZU 40X28', 'Marmol_sintetico', 'GEN-ED13D67D');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MODELO LAVATRAPEROS ECO 30X30')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MODELO LAVATRAPEROS ECO 30X30', 'Marmol_sintetico', 'GEN-3CB5F9F5');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MODELO MYDAS 182')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MODELO MYDAS 182', 'Fibra_de_vidrio', 'GEN-CAD24AF4');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE FRANCESA 181X123')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE FRANCESA 181X123', 'Fibra_de_vidrio', 'GEN-230C90A1');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE FALDON BAÑERA MALTA')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE FALDON BAÑERA MALTA', 'Fibra_de_vidrio', 'GEN-0E2352BB');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MODELO MESON COCINA VERSA 150X55  SIN PERF CUB')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MODELO MESON COCINA VERSA 150X55  SIN PERF CUB', 'Marmol_sintetico', 'GEN-6EF58BF8');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MODELO PLAQUITA PARA LVM GENOVA 94X48')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MODELO PLAQUITA PARA LVM GENOVA 94X48', 'Marmol_sintetico', 'GEN-CF6B87F1');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MODELO PLAQUITA PARA LVM GENOVA 79X48')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MODELO PLAQUITA PARA LVM GENOVA 79X48', 'Marmol_sintetico', 'GEN-116F0A49');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MODELO  PLAQUITA PARA LVM GENOVA 63X48')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MODELO  PLAQUITA PARA LVM GENOVA 63X48', 'Marmol_sintetico', 'GEN-47C61CA2');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE FALDON MILENIUM LARGO')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE FALDON MILENIUM LARGO', 'Fibra_de_vidrio', 'GEN-5E6FE39F');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE FALDON MILENIUM CORTO')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE FALDON MILENIUM CORTO', 'Fibra_de_vidrio', 'GEN-D1638545');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MODELO MESON COCINA 180X60 PERF-CUB V.2')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MODELO MESON COCINA 180X60 PERF-CUB V.2', 'Marmol_sintetico', 'GEN-919C6C70');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MODELO  LAVAPLATOS KOA 63X51 1 BOWL')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MODELO  LAVAPLATOS KOA 63X51 1 BOWL', 'Marmol_sintetico', 'GEN-0F80E082');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MODELO MEDIA ESFERA')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MODELO MEDIA ESFERA', 'Marmol_sintetico', 'GEN-A91077E2');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MODELO LAVAMANOS GENOVA 63X48')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MODELO LAVAMANOS GENOVA 63X48', 'Marmol_sintetico', 'GEN-80633A1D');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MODELO LAVARROPAS VERSA 55X50')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MODELO LAVARROPAS VERSA 55X50', 'Marmol_sintetico', 'GEN-F783BCA2');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MODELO LAVARROPAS AQUA 60X60 BRILLANTE')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MODELO LAVARROPAS AQUA 60X60 BRILLANTE', 'Marmol_sintetico', 'GEN-22014068');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MODELO LAVARROPAS AQUA 80X60 BRILLANTE')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MODELO LAVARROPAS AQUA 80X60 BRILLANTE', 'Marmol_sintetico', 'GEN-B5D74314');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MODELO LAVARROPAS AQUA 90X60 BRILLANTE')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MODELO LAVARROPAS AQUA 90X60 BRILLANTE', 'Marmol_sintetico', 'GEN-8629A216');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MODELO LAVARROPAS AQUA 48X60')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MODELO LAVARROPAS AQUA 48X60', 'Marmol_sintetico', 'GEN-61505A46');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MODELO LVM BARI 63X48')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MODELO LVM BARI 63X48', 'Marmol_sintetico', 'GEN-EC05A543');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE AMERICANA 157X78')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE AMERICANA 157X78', 'Fibra_de_vidrio', 'GEN-2BE6F5E6');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE AMERICANA 130X78')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE AMERICANA 130X78', 'Fibra_de_vidrio', 'GEN-EB17D8A8');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE AMERICANA 148X90')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE AMERICANA 148X90', 'Fibra_de_vidrio', 'GEN-5CC14D89');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE AMERICANA PLUS RTM DERECHA 153X78')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE AMERICANA PLUS RTM DERECHA 153X78', 'Fibra_de_vidrio', 'GEN-B6188A5C');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE AMERICANA PLUS RTM IZQUIERDA 153X78')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE AMERICANA PLUS RTM IZQUIERDA 153X78', 'Fibra_de_vidrio', 'GEN-0DF3576F');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE BAÑERA BALI')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE BAÑERA BALI', 'Fibra_de_vidrio', 'GEN-B5504791');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE CALIMA 152X80 CON ANTIDESLIZANTE')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE CALIMA 152X80 CON ANTIDESLIZANTE', 'Fibra_de_vidrio', 'GEN-E309C163');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE CALIMA 152X80 SIN ANTIDESLIZANTE')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE CALIMA 152X80 SIN ANTIDESLIZANTE', 'Fibra_de_vidrio', 'GEN-94B923B4');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE ARRECIFE 152X90')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE ARRECIFE 152X90', 'Fibra_de_vidrio', 'GEN-D29F31D1');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE ARRECIFE 183X90')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE ARRECIFE 183X90', 'Fibra_de_vidrio', 'GEN-BDDD5070');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE BARU 152X152')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE BARU 152X152', 'Fibra_de_vidrio', 'GEN-4A29712B');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE DELTA 150X150')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE DELTA 150X150', 'Fibra_de_vidrio', 'GEN-4544548B');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE ESPAÑOLA 170X75')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE ESPAÑOLA 170X75', 'Fibra_de_vidrio', 'GEN-749A247F');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE DELTA 130X130')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE DELTA 130X130', 'Fibra_de_vidrio', 'GEN-85CFB9DE');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE HEXAGONA 216X69')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE HEXAGONA 216X69', 'Fibra_de_vidrio', 'GEN-BA2C73EF');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE HAWAI ESQUINERA 150X150')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE HAWAI ESQUINERA 150X150', 'Fibra_de_vidrio', 'GEN-1FDD331F');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE GALAPAGOS 250X200')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE GALAPAGOS 250X200', 'Fibra_de_vidrio', 'GEN-3801F4C7');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE FRANCESA 180X100')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE FRANCESA 180X100', 'Fibra_de_vidrio', 'GEN-55BCB0CC');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE ZOCALO RTM 150X8.5  BRILLANTE')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE ZOCALO RTM 150X8.5  BRILLANTE', 'Marmol_sintetico', 'GEN-5430AC0B');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE ZOCALO 122X8.5 BRILLANTE')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE ZOCALO 122X8.5 BRILLANTE', 'Marmol_sintetico', 'GEN-0DDBA2C3');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE ZOCALO 150X8 PLANO RTM')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE ZOCALO 150X8 PLANO RTM', 'Marmol_sintetico', 'GEN-F8DAFEE3');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE ZOCALO 122X6 BRILLANTE')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE ZOCALO 122X6 BRILLANTE', 'Marmol_sintetico', 'GEN-7AB61E08');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE ZOCALO 122X10 BRILLANTE')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE ZOCALO 122X10 BRILLANTE', 'Marmol_sintetico', 'GEN-BFBD2BD8');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE ZOCALO 122X5.3 BRILLANTE')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE ZOCALO 122X5.3 BRILLANTE', 'Marmol_sintetico', 'GEN-8040E934');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE FALDON IBIZA')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE FALDON IBIZA', 'Fibra_de_vidrio', 'GEN-5C6B01C7');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE PASAMANOS BAÑERA HAWAII')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE PASAMANOS BAÑERA HAWAII', 'Fibra_de_vidrio', 'GEN-B7FCE9A5');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE TERRANOVA 183X113')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE TERRANOVA 183X113', 'Fibra_de_vidrio', 'GEN-7C2F29F0');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE FALDON BALI')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE FALDON BALI', 'Fibra_de_vidrio', 'GEN-576FD39F');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE CAJA SECADORA 50X40 MATE')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE CAJA SECADORA 50X40 MATE', 'Marmol_sintetico', 'GEN-1BECADEC');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE CAJA GRIFO LAVADORA 30X21 MATE')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE CAJA GRIFO LAVADORA 30X21 MATE', 'Marmol_sintetico', 'GEN-FF2AF60F');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE LAVARROPAS AQUA 60X60 MATE')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE LAVARROPAS AQUA 60X60 MATE', 'Marmol_sintetico', 'GEN-F9C60174');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE REPISA LAVAMANOS 63X20 MATE')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE REPISA LAVAMANOS 63X20 MATE', 'Marmol_sintetico', 'GEN-B608A9F5');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE TAPA EXTENSION 60CM MATE')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE TAPA EXTENSION 60CM MATE', 'Marmol_sintetico', 'GEN-872ACD38');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE LAVAMANOS SAHARA 48X41 MATE')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE LAVAMANOS SAHARA 48X41 MATE', 'Marmol_sintetico', 'GEN-6A611666');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE LAVARROPAS AQUA 80X60 MATE')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE LAVARROPAS AQUA 80X60 MATE', 'Marmol_sintetico', 'GEN-0E587693');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE LAVATRAPEROS AQUA 40X35 MATE')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE LAVATRAPEROS AQUA 40X35 MATE', 'Marmol_sintetico', 'GEN-EFC380C1');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE REGISTRO INSPECCION 65X45 MATE')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE REGISTRO INSPECCION 65X45 MATE', 'Marmol_sintetico', 'GEN-422422C2');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE LAVATRAPEROS 46X46 MATE')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE LAVATRAPEROS 46X46 MATE', 'Marmol_sintetico', 'GEN-5B08DC4C');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE LAVARROPAS ECO 60X55')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE LAVARROPAS ECO 60X55', 'Marmol_sintetico', 'GEN-FC3DA239');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE PISO DE DUCHA 80X80 MATE')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE PISO DE DUCHA 80X80 MATE', 'Marmol_sintetico', 'GEN-299FF395');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE PISO DE  DUCHA 90X90 MATE')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE PISO DE  DUCHA 90X90 MATE', 'Marmol_sintetico', 'GEN-3745F2C4');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE LAVARROPAS AQUA 48X60 MATE')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE LAVARROPAS AQUA 48X60 MATE', 'Marmol_sintetico', 'GEN-CD16F8A7');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MOLDE LAVARROPAS AQUA 90X60 MATE')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MOLDE LAVARROPAS AQUA 90X60 MATE', 'Marmol_sintetico', 'GEN-16C3CC58');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MODELO LAVAMANOS DOHA VESSEL 45X33')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MODELO LAVAMANOS DOHA VESSEL 45X33', 'Marmol_sintetico', 'GEN-6E8B408B');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MODELO LAVAMANOS TRENTINO 63X48 BRILLANTE')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MODELO LAVAMANOS TRENTINO 63X48 BRILLANTE', 'Marmol_sintetico', 'GEN-168EF174');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MODELO LAVAMANOS MECA VESSEL 35X35')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MODELO LAVAMANOS MECA VESSEL 35X35', 'Marmol_sintetico', 'GEN-414E331D');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MODELO MESON LAVAMANOS OASIS 63X48')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MODELO MESON LAVAMANOS OASIS 63X48', 'Marmol_sintetico', 'GEN-B2369A13');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MODELO LAVARROPAS VERSA 50X50 BRILLANTE')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MODELO LAVARROPAS VERSA 50X50 BRILLANTE', 'Marmol_sintetico', 'GEN-839635DC');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MODELO LAVARROPAS 48X51W BRILLANTE')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MODELO LAVARROPAS 48X51W BRILLANTE', 'Marmol_sintetico', 'GEN-40BA23A1');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MODELO LAVATRAPEROS PRO 46X36')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MODELO LAVATRAPEROS PRO 46X36', 'Marmol_sintetico', 'GEN-0EC0228A');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MODELO LAVARROPAS AQUA 60X60')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MODELO LAVARROPAS AQUA 60X60', 'Marmol_sintetico', 'GEN-3ED3913B');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MODELO LAVAMANOS OSLO 48X43')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MODELO LAVAMANOS OSLO 48X43', 'Marmol_sintetico', 'GEN-95FD1DF6');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MODELO LAVAMANOS OSLO 48X38')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MODELO LAVAMANOS OSLO 48X38', 'Marmol_sintetico', 'GEN-C85AD071');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tipos_moldes WHERE upper(molde_descripcion) = upper('MODELO LAVAMANOS OSLO 124X48')) THEN
        INSERT INTO public.tipos_moldes (molde_descripcion, planta, molde_sku) VALUES ('MODELO LAVAMANOS OSLO 124X48', 'Marmol_sintetico', 'GEN-F595811D');
    END IF;
END $$;
