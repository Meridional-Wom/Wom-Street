const CODIGO_LIDER = "WSCHILOE2026";
const API_URL = "https://script.google.com/macros/s/AKfycbxP2L869vhRVma1iNcwDEY8sV8X7OunPWuve4ot0BDr3v9fJFZmvhvZWjo2suF3cJsKdw/exec";

let datos = {};

function ocultarLoader(){
  const loader = document.getElementById("loader");
  if(loader){
    loader.style.opacity = "0";
    setTimeout(() => loader.remove(), 500);
  }
}

setTimeout(() => ocultarLoader(), 8000);

async function iniciar(){
  try{
    const res = await fetch(API_URL + "?t=" + Date.now());
    const data = await res.json();
    datos = transformarDatos(data);
    renderTodo();
  }catch(error){
    console.error("Error al cargar datos:", error);
    alert("No se pudieron cargar los datos desde Google Sheets.");
  }finally{
    ocultarLoader();
  }
}

async function actualizarDatos(){
  const boton = document.querySelector(".refresh-btn");
  if(boton){
    boton.textContent = "Actualizando...";
    boton.disabled = true;
  }

  try{
    const res = await fetch(API_URL + "?t=" + Date.now());
    const data = await res.json();
    datos = transformarDatos(data);
    renderTodo();
  }catch(error){
    alert("No se pudieron actualizar los datos.");
  }finally{
    if(boton){
      boton.textContent = "🔄 Actualizar";
      boton.disabled = false;
    }
  }
}

function transformarDatos(data){
  const dashboard = data.dashboard || {};

  return {
    dashboard:{
      ventas_dia:Number(dashboard["Ventas día"] || dashboard["Ventas Día"] || 0),
      meta_dia:Number(dashboard["Meta día"] || dashboard["Meta Día"] || 0),
      ventas_mtd:Number(dashboard["Ventas MTD"] || 0),
      meta_mes:Number(dashboard["Meta mes"] || dashboard["Meta Mes"] || 0),
      fcst:Number(dashboard["FCST"] || dashboard["FCST manual"] || 0)
    },
    equipo:(data.equipo || []).map(e => ({
      nombre:e["Ejecutivo"] || "",
      ventas_dia:Number(e["Ventas Día"] || e["Hoy"] || 0),
      mtd:Number(e["Ventas MTD"] || e["MTD"] || 0),
      meta:Number(e["Meta Mes"] || e["Meta"] || 0),
      observacion:e["Observación"] || ""
    })),
    avisos:(data.avisos || []).map(a => ({
      titulo:a["Título"] || "",
      descripcion:a["Descripción"] || ""
    })),
    biblioteca:(data.biblioteca || []).map(b => ({
      titulo:b["Título"] || "",
      descripcion:b["Descripción"] || "",
      url:b["Link"] || "#"
    })),
    publicidad:(data.publicidad || []).map(p => ({
      titulo:p["Título"] || "",
      descripcion:p["Descripción"] || "",
      url:p["Link"] || "#"
    })),
    links:(data.links || []).map(l => ({
      nombre:l["Nombre"] || "",
      categoria:l["Categoría"] || "",
      url:l["URL"] || "#"
    })),
    rutas:(data.rutas || []).map(r => ({
      dia:r["Día"] || r["Fecha"] || "",
      sector:r["Sector"] || "",
      responsable:r["Responsable"] || ""
    })),
    reembolsos:(data.reembolsos || []).map(r => ({
      ejecutivo:r["Ejecutivo"] || "",
      monto:r["Monto"] || "",
      estado:r["Estado"] || ""
    }))
  };
}

function mostrar(id){
  document.querySelectorAll(".section").forEach(s => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  window.scrollTo({top:0,behavior:"smooth"});
}

function validarCodigo(){
  const codigo = document.getElementById("codigo").value.trim();
  const error = document.getElementById("error");

  if(codigo === CODIGO_LIDER){
    document.getElementById("loginLider").classList.add("hidden");
    document.getElementById("panelLider").classList.remove("hidden");
    error.textContent = "";
    cargarFormulario();
  }else{
    error.textContent = "Código incorrecto";
  }
}

function porcentaje(valor, meta){
  if(!meta) return 0;
  return Math.round((valor / meta) * 100);
}

function color(p){
  if(p >= 90) return "green";
  if(p >= 60) return "yellow";
  return "red";
}

function estado(p){
  if(p >= 90) return "Sobre meta";
  if(p >= 60) return "En riesgo";
  return "Bajo meta";
}

function calcular(){
  const d = datos.dashboard;
  d.cumplimiento_dia = porcentaje(d.ventas_dia, d.meta_dia);
  d.cumplimiento_mes = porcentaje(d.ventas_mtd, d.meta_mes);
  d.gap = d.ventas_mtd - d.meta_mes;
  d.diferencia_fcst = d.fcst - d.meta_mes;
  d.estado_fcst = porcentaje(d.fcst, d.meta_mes);

  datos.equipo.forEach(e => {
    e.cumplimiento = porcentaje(e.mtd, e.meta);
    e.gap = e.mtd - e.meta;
  });
}

function renderTodo(){
  calcular();
  renderHeader();
  renderKpis();
  renderEquipo();
  renderAvisos();
  renderBiblioteca();
  renderPublicidad();
  renderLinks();
  renderPrivado();
}

function renderHeader(){
  const ahora = new Date();
  const fecha = ahora.toLocaleDateString("es-CL") + " " + ahora.toLocaleTimeString("es-CL",{hour:"2-digit",minute:"2-digit"});
  document.getElementById("ultimaActualizacion").textContent = "Actualizado: " + fecha;
}

function kpi(titulo, valor, subtitulo, progreso){
  const barra = progreso !== undefined ? `<div class="progress"><span style="width:${Math.min(progreso,100)}%"></span></div>` : "";
  return `<div class="card"><div class="kpi-title">${titulo}</div><div class="kpi-value">${valor}</div><p class="kpi-sub">${subtitulo || ""}</p>${barra}</div>`;
}

function renderKpis(){
  const d = datos.dashboard;

  document.getElementById("kpisDia").innerHTML = `
    ${kpi("Ventas del día", d.ventas_dia, "Gestión diaria")}
    ${kpi("Meta diaria", d.meta_dia, "Objetivo del día")}
    ${kpi("Cumplimiento diario", d.cumplimiento_dia + "%", estado(d.cumplimiento_dia), d.cumplimiento_dia)}
  `;

  document.getElementById("kpisMes").innerHTML = `
    ${kpi("Ventas MTD", d.ventas_mtd, "Acumulado del mes")}
    ${kpi("Meta mensual", d.meta_mes, "Objetivo mensual")}
    ${kpi("Cumplimiento mes", d.cumplimiento_mes + "%", estado(d.cumplimiento_mes), d.cumplimiento_mes)}
    ${kpi("GAP", d.gap, "Diferencia contra meta")}
  `;

  document.getElementById("kpisForecast").innerHTML = `
    ${kpi("FCST", d.fcst, "Proyección de cierre")}
    ${kpi("Diferencia FCST", d.diferencia_fcst, "Forecast vs meta")}
    <div class="card">
      <div class="kpi-title">Estado de cierre</div>
      <div class="kpi-value"><span class="badge ${color(d.estado_fcst)}">${estado(d.estado_fcst)}</span></div>
      <p class="kpi-sub">Según la proyección actual</p>
    </div>
  `;
}

function renderEquipo(){
  document.getElementById("equipoCards").innerHTML = datos.equipo.map(e => `
    <div class="person">
      <div class="person-top">
        <div class="person-name">${e.nombre}</div>
        <span class="badge ${color(e.cumplimiento)}">${estado(e.cumplimiento)}</span>
      </div>
      <div class="person-grid">
        <div class="mini"><span>Hoy</span><strong>${e.ventas_dia}</strong></div>
        <div class="mini"><span>MTD</span><strong>${e.mtd}</strong></div>
        <div class="mini"><span>Meta</span><strong>${e.meta}</strong></div>
        <div class="mini"><span>Cump.</span><strong>${e.cumplimiento}%</strong></div>
      </div>
    </div>
  `).join("");
}

function renderAvisos(){
  document.getElementById("avisosLista").innerHTML = datos.avisos.map(a => `<div class="card"><h3>${a.titulo}</h3><p>${a.descripcion}</p></div>`).join("");
}

function renderBiblioteca(){
  document.getElementById("bibliotecaLista").innerHTML = datos.biblioteca.map(b => `<div class="card"><h3>${b.titulo}</h3><p>${b.descripcion}</p><a href="${b.url}" target="_blank">Abrir</a></div>`).join("");
}

function renderPublicidad(){
  document.getElementById("publicidadLista").innerHTML = datos.publicidad.map(p => `<div class="card"><h3>${p.titulo}</h3><p>${p.descripcion}</p><a href="${p.url}" target="_blank">Ver material</a></div>`).join("");
}

function renderLinks(){
  document.getElementById("linksLista").innerHTML = datos.links.map(l => `<div class="card"><h3>${l.nombre}</h3><p>${l.categoria}</p><a href="${l.url}" target="_blank">Abrir enlace</a></div>`).join("");
}

function renderPrivado(){
  document.getElementById("liderEquipo").innerHTML = document.getElementById("equipoCards").innerHTML;

  document.getElementById("rutasLista").innerHTML = datos.rutas.map(r => `<div class="card"><h3>${r.dia}</h3><p>${r.sector}</p><small>${r.responsable}</small></div>`).join("");

  document.getElementById("reembolsosLista").innerHTML = datos.reembolsos.map(r => `<div class="card"><h3>${r.ejecutivo}</h3><p>Monto: ${r.monto}</p><span class="badge yellow">${r.estado}</span></div>`).join("");
}

function cargarFormulario(){
  const d = datos.dashboard;
  document.getElementById("formVentasDia").value = d.ventas_dia;
  document.getElementById("formMetaDia").value = d.meta_dia;
  document.getElementById("formVentasMTD").value = d.ventas_mtd;
  document.getElementById("formMetaMes").value = d.meta_mes;
  document.getElementById("formFcst").value = d.fcst;
}

function guardarIndicadores(){
  alert("Por ahora los datos se actualizan desde Google Sheets.");
}

function resetearDatos(){
  location.reload();
}

function horaActual(){
  return new Date().toLocaleTimeString("es-CL",{hour:"2-digit",minute:"2-digit"});
}

function generarHTMLAvanceDia(){
  const d = datos.dashboard;

  return `
    <div class="share-card" id="cardDia">
      <div class="share-inner">
        <div class="share-top">
          <div>
            <div class="share-label">Reporte comercial</div>
            <div class="share-brand">WOM STREET CHILOÉ</div>
          </div>
          <div class="share-time">${horaActual()} hrs</div>
        </div>

        <div class="share-title">AVANCE</div>

        <div class="share-main">
          <div>
            <div class="share-main-title">Ventas día / Meta día</div>
            <div class="share-main-number">${d.ventas_dia} / ${d.meta_dia}</div>
          </div>
          <div class="share-subline">Gestión diaria</div>
        </div>

        <div class="share-section-title">Equipo</div>

        <div class="share-list">
          ${datos.equipo.map(e => `
            <div class="share-row">
              <span>${e.nombre.split(" ")[0]}</span>
              <strong>${e.ventas_dia}</strong>
            </div>
          `).join("")}
        </div>

        <div class="share-footer">
          <span>Total equipo: ${d.ventas_dia}</span>
          <span>Actualizado ${horaActual()} hrs</span>
        </div>
      </div>
    </div>
  `;
}

function generarHTMLAvanceMensual(){
  const d = datos.dashboard;

  return `
    <div class="share-card" id="cardMes">
      <div class="share-inner">
        <div class="share-top">
          <div>
            <div class="share-label">Reporte comercial</div>
            <div class="share-brand">WOM STREET CHILOÉ</div>
          </div>
          <div class="share-time">${horaActual()} hrs</div>
        </div>

        <div class="share-title">AVANCE MENSUAL</div>

        <div class="share-main">
          <div>
            <div class="share-main-title">Ventas MTD / Meta mensual</div>
            <div class="share-main-number">${d.ventas_mtd} / ${d.meta_mes}</div>
          </div>
          <div>
            <div class="share-percent">${d.cumplimiento_mes}%<small>Cumplimiento</small></div>
            <div class="share-subline">FCST: ${d.fcst}</div>
          </div>
        </div>

        <div class="share-section-title">Equipo</div>

        <div class="share-list">
          ${datos.equipo.map(e => `
            <div class="share-row">
              <span>${e.nombre.split(" ")[0]}</span>
              <strong>${e.mtd} / ${e.meta} (${e.cumplimiento}%)</strong>
            </div>
          `).join("")}
        </div>

        <div class="share-footer">
          <span>Total equipo: ${d.ventas_mtd} / ${d.meta_mes}</span>
          <span>${d.cumplimiento_mes}% mensual</span>
        </div>
      </div>
    </div>
  `;
}

async function descargarImagen(id, nombreArchivo){
  const elemento = document.getElementById(id);
  const canvas = await html2canvas(elemento,{scale:2,backgroundColor:null});
  const blob = await new Promise(resolve => canvas.toBlob(resolve,"image/png"));

  const file = new File([blob], nombreArchivo, {type:"image/png"});

  if(navigator.canShare && navigator.canShare({files:[file]})){
    await navigator.share({
      files:[file],
      title:"WOM Street Chiloé",
      text:"Avance comercial WOM Street Chiloé"
    });
  }else{
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = nombreArchivo;
    link.click();
  }
}

async function generarImagenAvanceDia(){
  const area = document.getElementById("shareArea");
  area.innerHTML = generarHTMLAvanceDia();
  await descargarImagen("cardDia","avance-wom-street.png");
  area.innerHTML = "";
}

async function generarImagenAvanceMensual(){
  const area = document.getElementById("shareArea");
  area.innerHTML = generarHTMLAvanceMensual();
  await descargarImagen("cardMes","avance-mensual-wom-street.png");
  area.innerHTML = "";
}

iniciar();