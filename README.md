# Divider MK IX Web (preliminar)

Aplicación estática para preparar una imagen en mosaico de páginas imprimibles. Está diseñada para publicarse en GitHub Pages y funciona en navegadores móviles modernos.

## Uso local

Abre `index.html` en un navegador o sirve esta carpeta con cualquier servidor estático. Para exportar a PDF necesita cargar jsPDF desde cdnjs, por lo que esa función requiere conexión a internet.

## Publicar en GitHub Pages

En GitHub, abre **Settings → Pages**, selecciona la rama y la carpeta `/web` si la configuración lo permite. Si Pages solo ofrece la raíz o `/docs`, copia esta carpeta a la ubicación elegida o configura un workflow para publicar `web/` como artefacto. No requiere backend ni procesa imágenes en un servidor.

## Funciones incluidas

- Selección de varias imágenes y navegación por cola.
- Carta, Oficio y Doble Carta; orientación automática o manual.
- Medidas en centímetros y bloqueo de proporción.
- Vista previa del mosaico con selección táctil de hojas.
- Recorte por arrastre.
- Nombre personalizado para el PDF y exportación de las hojas seleccionadas.
- El botón de descarga comparte el archivo desde el menú nativo del teléfono cuando el navegador lo admite; en otros navegadores descarga el PDF.

## Límites de esta versión

Es una primera versión sin pruebas en una matriz de teléfonos. La exportación crea buffers de imagen en el navegador; imágenes grandes pueden consumir mucha memoria en móviles. La librería PDF se carga desde cdnjs. Conviene validar tamaños de impresión y márgenes en la impresora antes de imprimir varias hojas.
