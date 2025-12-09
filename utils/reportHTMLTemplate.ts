/**
 * Template HTML para generar PDFs de reportes
 * Basado en el diseño del backend para mantener consistencia
 */

export const generateReportHTML = (report: any, logoBase64: string = ''): string => {
  // Formatear fechas - mostrar tal como vienen del dispositivo
  const formatDate = (dateString: string) => {
    if (!dateString) return 'No registrado';
    // Parsear la fecha tal como viene (hora del dispositivo)
    const date = new Date(dateString);
    
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    let hours = date.getHours();
    const minutes = date.getMinutes();
    
    const monthNames = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 = 12
    const minutesStr = String(minutes).padStart(2, '0');
    
    return `${day} de ${monthNames[month]} de ${year}, ${hours}:${minutesStr} ${ampm}`;
  };

  // Obtener fecha actual del dispositivo
  const now = new Date();
  const currentDate = formatDate(now.toISOString());
  const entryTime = formatDate(report.entryTime);
  const exitTime = formatDate(report.exitTime);

  // Parámetros antes
  const paramsBefore = report.parametersBefore || {};
  const paramsBeforeHTML = Object.entries(paramsBefore)
    .map(([key, value]) => `
      <div class="param-card">
        <div class="param-label">${key.toUpperCase()}</div>
        <div class="param-value">${value}</div>
      </div>
    `).join('');

  // Químicos
  const chemicalUnits: Record<string, string> = {
    tricloro: 'kg',
    tabletas: 'unidades',
    acido: 'gl',
    soda: 'kg',
    bicarbonato: 'kg',
    sal: 'bolsas',
    alguicida: 'L',
    clarificador: 'L',
    cloro_liquido: 'gl'
  };

  const chemicals = report.chemicals || {};
  const chemicalsHTML = Object.entries(chemicals)
    .filter(([key, value]) => Number(value) > 0)
    .map(([key, value]) => `
      <div class="chem-card">
        <div class="chem-icon">🧪</div>
        <div class="chem-info">
          <div class="chem-label">${key}</div>
          <div class="chem-value">${value} ${chemicalUnits[key] || ''}</div>
        </div>
      </div>
    `).join('');

  // Equipos
  const equipment = report.equipmentCheck || {};
  console.log('🔧 Equipment data en template:', equipment);
  console.log('🔧 Equipment entries:', Object.entries(equipment));
  
  const equipmentHTML = Object.entries(equipment)
    .map(([key, value]: [string, any]) => {
      const isOldFormat = typeof value === 'boolean';
      const aplica = isOldFormat ? true : value.aplica;
      const working = isOldFormat ? value : value.working;
      
      console.log(`🔧 Processing ${key}:`, { value, isOldFormat, aplica, working });
      
      const icon = !aplica ? '⊘' : (working ? '✅' : '❌');
      const statusClass = !aplica ? 'not-applicable' : (working ? 'working' : 'not-working');
      const statusText = !aplica ? 'No aplica' : (working ? 'Funcionando' : 'No funciona');
      
      return `<div class="equip-card ${statusClass}">
  <div class="equip-icon">${icon}</div>
  <div class="equip-info">
    <div class="equip-label">${key.replace(/_/g, ' ')}</div>
    <div class="equip-status">${statusText}</div>
  </div>
</div>`;
    }).join('\n');
  
  console.log('🔧 Generated equipmentHTML length:', equipmentHTML.length);
  console.log('🔧 Equipment count:', Object.keys(equipment).length);

  // Fotos
  const photoSections = [
    { title: 'Foto Cloro/pH', photo: report.photoCloroPh, key: 'photoCloroPh' },
    { title: 'Foto Alcalinidad', photo: report.photoAlcalinidad, key: 'photoAlcalinidad' },
    { title: 'Foto Dureza', photo: report.photoDureza, key: 'photoDureza', optional: true },
    { title: 'Foto Estabilizador', photo: report.photoEstabilizador, key: 'photoEstabilizador', optional: true }
  ];

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=0.5, maximum-scale=3.0, user-scalable=yes">
  <title>Reporte ${report.reportNumber || 'N/A'}</title>
  <style>
    @page {
      margin: 0;
      size: A4;
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    html {
      -webkit-text-size-adjust: 100%;
    }

    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #1a1a1a;
      background: white;
    }

    .page {
      width: 100%;
      max-width: 210mm;
      min-height: 297mm;
      padding: 10mm 15mm 15mm 15mm;
      margin: 0 auto;
      background: white;
    }

    /* Header */
    .header {
      background: white;
      padding: 20px 25px;
      border-radius: 8px;
      margin-bottom: 20px;
      border: 2px solid #e0e0e0;
    }

    .header-content {
      width: 100%;
    }

    .logo-section {
      float: left;
      width: 30%;
    }

    .logo {
      color: #1a1a1a;
      font-size: 24px;
      font-weight: bold;
    }

    .logo-img {
      height: 100px;
      width: auto;
      display: block;
    }

    .header-info {
      float: right;
      width: 65%;
      text-align: right;
      color: #1a1a1a;
    }

    .doc-title {
      font-size: 20px;
      font-weight: bold;
      margin-bottom: 8px;
      text-transform: uppercase;
      color: #1a1a1a;
    }

    .report-number-label {
      font-size: 11px;
      font-weight: 500;
      margin-bottom: 6px;
      color: #000000ff;
    }

    .report-number {
      font-size: 18px;
      background: #f5f5f5;
      padding: 6px 14px;
      border-radius: 15px;
      display: inline-block;
      font-weight: bold;
      border: 2px solid #e0e0e0;
      color: #1a1a1a;
    }

    .report-date {
      font-size: 11px;
      margin-top: 8px;
      color: #000000ff;
    }

    .clearfix {
      clear: both;
    }

    /* Sections */
    .info-section {
      margin-bottom: 28px;
      page-break-inside: avoid;
    }

    .section-title {
      font-size: 18px;
      font-weight: 700;
      color: #1e3c72;
      margin-bottom: 18px;
      padding-bottom: 10px;
      border-bottom: 4px solid #2a5298;
      text-transform: uppercase;
      letter-spacing: 1px;
      page-break-after: avoid;
    }

    .info-grid {
      width: 100%;
      margin-bottom: 15px;
    }

    .info-grid::after {
      content: "";
      display: table;
      clear: both;
    }

    .info-card {
      width: 48%;
      float: left;
      margin-right: 2%;
      margin-bottom: 12px;
      background: #f8f9fa;
      border-left: 4px solid #2a5298;
      padding: 12px 15px;
      border-radius: 6px;
      box-sizing: border-box;
    }

    .info-card:nth-child(2n) {
      margin-right: 0;
    }

    .info-label {
      font-weight: 700;
      color: #495057;
      display: block;
      margin-bottom: 6px;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .info-value {
      color: #1e3c72;
      font-size: 15px;
      font-weight: 600;
    }

    /* Parameters */
    .params-grid {
      width: 100%;
      margin-bottom: 15px;
    }

    .params-grid::after {
      content: "";
      display: table;
      clear: both;
    }

    .param-card {
      width: 31.33%;
      float: left;
      margin-right: 2%;
      margin-bottom: 12px;
      background: #e3f2fd;
      border: 2px solid #1976d2;
      padding: 12px;
      border-radius: 8px;
      text-align: center;
      box-sizing: border-box;
    }

    .param-card:nth-child(3n) {
      margin-right: 0;
    }

    .param-label {
      font-weight: 700;
      color: #1565c0;
      font-size: 11px;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .param-value {
      color: #0d47a1;
      font-size: 22px;
      font-weight: 700;
    }

    /* Chemicals */
    .chem-grid {
      width: 100%;
      margin-bottom: 15px;
    }

    .chem-grid::after {
      content: "";
      display: table;
      clear: both;
    }

    .chem-card {
      width: 31.33%;
      float: left;
      margin-right: 2%;
      margin-bottom: 12px;
      background: #fff3e0;
      border: 2px solid #f57c00;
      padding: 10px;
      border-radius: 8px;
      box-sizing: border-box;
    }

    .chem-card:nth-child(3n) {
      margin-right: 0;
    }

    .chem-icon {
      font-size: 24px;
      float: left;
      margin-right: 10px;
    }

    .chem-info {
      overflow: hidden;
    }

    .chem-label {
      font-weight: 700;
      color: #e65100;
      font-size: 11px;
      margin-bottom: 4px;
      text-transform: uppercase;
    }

    .chem-value {
      color: #bf360c;
      font-size: 18px;
      font-weight: 700;
    }

    /* Equipment */
    .equip-grid {
      width: 100%;
      margin-bottom: 15px;
    }

    .equip-grid::after {
      content: "";
      display: table;
      clear: both;
    }

    .equip-card {
      width: 48%;
      float: left;
      margin-right: 2%;
      margin-bottom: 12px;
      padding: 12px 14px;
      border-radius: 8px;
      border: 2px solid;
      box-sizing: border-box;
    }

    .equip-card:nth-child(2n) {
      margin-right: 0;
    }

    .equip-card.working {
      background: #e8f5e9;
      border-color: #43a047;
    }

    .equip-card.not-working {
      background: #ffebee;
      border-color: #e53935;
    }

    .equip-card.not-applicable {
      background: #f5f5f5;
      border-color: #999;
      opacity: 0.7;
    }

    .equip-icon {
      font-size: 24px;
      float: left;
      margin-right: 10px;
    }

    .equip-info {
      overflow: hidden;
    }

    .equip-label {
      font-weight: 600;
      color: #2c3e50;
      font-size: 13px;
      margin-bottom: 3px;
    }

    .equip-status {
      font-weight: 700;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .equip-card.working .equip-status {
      color: #2e7d32;
    }

    .equip-card.not-working .equip-status {
      color: #c62828;
    }

    .materials-box, .observations-box {
      background: #fff8e1;
      border-left: 5px solid #ffa726;
      padding: 15px 18px;
      border-radius: 8px;
      margin-bottom: 18px;
      color: #e65100;
      font-size: 14px;
      line-height: 1.8;
      white-space: pre-wrap;
    }

    /* Photos */
    .photos-grid {
      width: 100%;
      margin-bottom: 20px;
    }

    .photos-grid::after {
      content: "";
      display: table;
      clear: both;
    }

    .photo-card {
      width: 48%;
      float: left;
      margin-right: 2%;
      margin-bottom: 15px;
      background: white;
      border: 3px solid #2a5298;
      border-radius: 8px;
      overflow: hidden;
      box-sizing: border-box;
    }

    .photo-card:nth-child(2n) {
      margin-right: 0;
    }

    .photo-card.disabled {
      opacity: 0.5;
      border-color: #999;
    }

    .photo-title {
      background: #1e3c72;
      background: -webkit-linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
      color: white;
      padding: 10px 14px;
      font-weight: bold;
      font-size: 12px;
      text-transform: uppercase;
      text-align: center;
    }

    .photo-container {
      padding: 12px;
      text-align: center;
      background: #f8f9fa;
      min-height: 180px;
    }

    .photo-container.no-photo {
      color: #999;
      font-style: italic;
      padding-top: 80px;
    }

    .photo-container img {
      max-width: 100%;
      max-height: 280px;
      border-radius: 6px;
    }

    /* Footer */
    .footer {
      margin-top: 40px;
      padding-top: 25px;
      border-top: 3px solid #2a5298;
      text-align: center;
      color: #666;
      font-size: 12px;
    }

    .footer-logo {
      font-size: 24px;
      font-weight: 700;
      color: #1e3c72;
      margin-bottom: 8px;
    }
  </style>
</head>
<body>
  <div class="page">
    <!-- Header -->
    <div class="header">
      <div class="header-content">
        <div class="logo-section">
          ${logoBase64 ? `<img src="${logoBase64}" alt="AquaPool Blue" class="logo-img">` : '<div class="logo">🏊‍♂️ AquaPool Blue</div>'}
        </div>
        <div class="header-info">
          <div class="doc-title">Reporte de Mantenimiento</div>
          <div class="report-number-label">Número de Reporte</div>
          <div class="report-number">${report.reportNumber || 'N/A'}</div>
          <div class="report-date">Generado: ${currentDate}</div>
        </div>
        <div class="clearfix"></div>
      </div>
    </div>

    <!-- Información General -->
    <div class="info-section">
      <div class="section-title">📋 INFORMACIÓN GENERAL</div>
      <div class="info-grid">
        <div class="info-card">
          <div class="info-label">Cliente / Proyecto</div>
          <div class="info-value">${report.clientName || report.projectName || 'N/A'}</div>
        </div>
        <div class="info-card">
          <div class="info-label">Ubicación</div>
          <div class="info-value">${report.location || 'N/A'}</div>
        </div>
        <div class="info-card">
          <div class="info-label">Técnico Responsable</div>
          <div class="info-value">${report.technician || 'N/A'}</div>
        </div>
        <div class="info-card">
          <div class="info-label">Fecha del Servicio</div>
          <div class="info-value">${formatDate(report.entryTime).split(',')[0]}</div>
        </div>
        <div class="info-card">
          <div class="info-label">Hora de Entrada</div>
          <div class="info-value">${entryTime.split(',')[1] || 'N/A'}</div>
        </div>
        <div class="info-card">
          <div class="info-label">Hora de Salida</div>
          <div class="info-value">${exitTime.split(',')[1] || 'N/A'}</div>
        </div>
      </div>
    </div>

    <!-- Parámetros -->
    ${paramsBeforeHTML ? `
    <div class="info-section">
      <div class="section-title">🔬 PARÁMETROS DEL AGUA</div>
      <div class="params-grid">
        ${paramsBeforeHTML}
      </div>
    </div>
    ` : ''}

    <!-- Químicos -->
    ${chemicalsHTML ? `
    <div class="info-section">
      <div class="section-title">🧪 QUÍMICOS APLICADOS</div>
      <div class="chem-grid">
        ${chemicalsHTML}
      </div>
    </div>
    ` : ''}

    <!-- Equipos -->
    ${Object.keys(equipment).length > 0 ? `
    <div class="info-section">
      <div class="section-title">⚙️ REVISIÓN DE EQUIPOS</div>
      <div class="equip-grid">
        ${equipmentHTML}
        <div style="clear: both;"></div>
      </div>
    </div>
    ` : ''}

    <!-- Materiales -->
    ${report.materialsDelivered ? `
    <div class="info-section">
      <div class="section-title">📦 MATERIALES ENTREGADOS</div>
      <div class="materials-box">${report.materialsDelivered}</div>
    </div>
    ` : ''}

    <!-- Observaciones -->
    ${report.observations ? `
    <div class="info-section">
      <div class="section-title">📝 OBSERVACIONES</div>
      <div class="observations-box">${report.observations}</div>
    </div>
    ` : ''}

    <!-- Fotos -->
    <div class="info-section">
      <div class="section-title">📸 EVIDENCIA FOTOGRÁFICA</div>
      <div class="photos-grid">
        ${photoSections.map(section => `
          <div class="photo-card ${!section.photo ? 'disabled' : ''}">
            <div class="photo-title">${section.title}${section.optional ? ' (Opcional)' : ''}</div>
            <div class="photo-container ${!section.photo ? 'no-photo' : ''}">
              ${section.photo ? `<img src="${section.photo}" alt="${section.title}">` : 'No disponible'}
            </div>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <div class="footer-logo">Aqua Pool Blue</div>
      <div>Sistema de Gestión de Mantenimiento de Piscinas</div>
      <div>© ${new Date().getFullYear()} - Todos los derechos reservados</div>
    </div>
  </div>
</body>
</html>
  `;
};
