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
    console.error("Error al actualizar datos:", error);
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
      ventas_dia:Number(e["Ventas Día"] || e["Ventas Dia"] || e["Hoy"] || 0),
      mtd:Number(e["Ventas MTD"] || e["MTD"] || 0),
      meta:Number(e["Meta Mes"] || e["Meta"] || 0),
      observacion:e["Observación"] || e["Observacion"] || "",
      ultima_venta:e["Última venta"] || e["Ultima venta"] || ""
    })),

    avisos:(data.avisos || []).map(a => ({
      titulo:a["Título"] || a["Titulo"] || "",
      descripcion:a["Descripción"] || a["Descripcion"] || ""
    })),

    biblioteca:(data.biblioteca || []).map(b => ({
      titulo:b["Título"] || b["Titulo"] || "",
      descripcion:b["Descripción"] || b["Descripcion"] || "",
      url:b["Link"] || b["URL"] || "#"
    })),

    publicidad:(data.publicidad || []).map(p => ({
      titulo:p["Título"] || p["Titulo"] || "",
      descripcion:p["Descripción"] || p["Descripcion"] || "",
      url:p["Link"] || p["URL"] || "#"
    })),

    links:(data.links || []).map(l => ({
      nombre:l["Nombre"] || "",
      categoria:l["Categoría"] || l["Categoria"] || "",
      url:l["URL"] || l["Link"] || "#"
    })),

    rutas:(data.rutas || []).map(r => ({
      dia:r["Día"] || r["Dia"] || r["Fecha"] || "",
      sector:r["Sector"] || "",
      responsable:r["Responsable"] || ""
    })),

    reembolsos:(data.reembolsos || []).map(r => ({
      ejecutivo:r["Ejecutivo"] || "",
      monto:r["Monto"] || "",
      estado:r["Estado"] || ""
    })),

    ventas_diarias:data.ventas_diarias || []
  };
}

function mostrar(id){
  document.querySelectorAll(".section").forEach(s => s.classList.remove("active"));

  const seccion = document.getElementById(id);
  if(seccion){
    seccion.classList.add("active");
    window.scrollTo({top:0,behavior:"smooth"});
  }
}

function validarCodigo(){
  const codigo = document.getElementById("codigo").value.trim();
  const error = document.getElementById("error");

  if(codigo === CODIGO_LIDER){
    document.getElementById("loginLider").classList.add("hidden");
    document.getElementById("panelLider").classList.remove("hidden");
    error.textContent = "";
    cargarSelectEjecutivos();
  }else{
    error.textContent = "Código incorrecto";
  }
}

function porcentaje(valor, meta){
  if(!meta || meta === 0) return 0;
  return Math.round((valor / meta) * 100);
}

function limitar(valor){
  return Math.min(Math.max(valor,0),100);
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
  renderInicioV2();
  renderEquipo();
  renderAvisos();
  renderBiblioteca();
  renderPublicidad();
  renderLinks();
  renderPrivado();
  cargarSelectEjecutivos();
}

function renderHeader(){
  const el = document.getElementById("ultimaActualizacion");
  if(el){
    el.textContent = "Actualizado: " + fechaCorta();
  }
}

function renderInicioV2(){
  const d = datos.dashboard;

  const ventasDiaPrincipal = document.getElementById("ventasDiaPrincipal");
  const cumplimientoDiaPrincipal = document.getElementById("cumplimientoDiaPrincipal");
  const barraDiaPrincipal = document.getElementById("barraDiaPrincipal");
  const textoMetaDia = document.getElementById("textoMetaDia");
  const mensajeMetaDia = document.getElementById("mensajeMetaDia");
  const estadoDiaBadge = document.getElementById("estadoDiaBadge");

  if(ventasDiaPrincipal){
    ventasDiaPrincipal.textContent = `${d.ventas_dia} / ${d.meta_dia}`;
  }

  if(cumplimientoDiaPrincipal){
    cumplimientoDiaPrincipal.textContent = `${d.cumplimiento_dia}%`;
  }

  if(barraDiaPrincipal){
    barraDiaPrincipal.style.width = limitar(d.cumplimiento_dia) + "%";
  }

  if(textoMetaDia){
    textoMetaDia.textContent = "Meta diaria: " + d.meta_dia;
  }

  if(mensajeMetaDia){
    const faltan = d.meta_dia - d.ventas_dia;

    if(faltan > 0){
      mensajeMetaDia.textContent = `Faltan ${faltan} ventas para cumplir la meta diaria.`;
    }else if(faltan === 0){
      mensajeMetaDia.textContent = "Meta diaria cumplida.";
    }else{
      mensajeMetaDia.textContent = `Meta superada por ${Math.abs(faltan)} ventas.`;
    }
  }

  if(estadoDiaBadge){
    estadoDiaBadge.textContent = estado(d.cumplimiento_dia);
    estadoDiaBadge.className = "badge " + color(d.cumplimiento_dia);
  }

  const avanceMensualPrincipal = document.getElementById("avanceMensualPrincipal");
  const cumplimientoMesPrincipal = document.getElementById("cumplimientoMesPrincipal");
  const barraMesPrincipal = document.getElementById("barraMesPrincipal");

  if(avanceMensualPrincipal){
    avanceMensualPrincipal.textContent = `${d.ventas_mtd} / ${d.meta_mes}`;
  }

  if(cumplimientoMesPrincipal){
    cumplimientoMesPrincipal.textContent = `${d.cumplimiento_mes}%`;
  }

  if(barraMesPrincipal){
    barraMesPrincipal.style.width = limitar(d.cumplimiento_mes) + "%";
  }

  const fcstPrincipal = document.getElementById("fcstPrincipal");
  const diferenciaFcstPrincipal = document.getElementById("diferenciaFcstPrincipal");

  if(fcstPrincipal){
    fcstPrincipal.textContent = d.fcst;
  }

  if(diferenciaFcstPrincipal){
    const diff = d.fcst - d.meta_mes;
    diferenciaFcstPrincipal.textContent = `${diff >= 0 ? "+" : ""}${diff} vs Meta`;
  }

  renderVentasHoy();
}

function renderVentasHoy(){
  const contenedor = document.getElementById("ventasHoyLista");
  if(!contenedor) return;

  const conVentas = datos.equipo.filter(e => e.ventas_dia > 0);
  const sinVentas = datos.equipo.filter(e => e.ventas_dia <= 0);

  let html = "";

  if(conVentas.length > 0){
    html += conVentas.map(e => `
      <div class="venta-row">
        <span>${primerNombre(e.nombre)}</span>
        <strong>+${e.ventas_dia}</strong>
      </div>
    `).join("");
  }else{
    html += `<p class="note">Aún no hay ventas registradas hoy.</p>`;
  }

  if(sinVentas.length > 0){
    html += `<div class="sin-ventas-title">Sin ventas hoy</div>`;

    html += sinVentas.map(e => `
      <div class="venta-row muted">
        <span>${primerNombre(e.nombre)}</span>
        <strong>0</strong>
      </div>
    `).join("");
  }

  contenedor.innerHTML = html;
}

function renderEquipo(){
  const contenedor = document.getElementById("equipoCards");
  if(!contenedor) return;

  contenedor.innerHTML = datos.equipo.map(e => `
    <div class="equipo-row">
      <div>
        <strong>${primerNombre(e.nombre)}</strong>
        <small>${e.ultima_venta ? "Última venta: " + formatearFecha(e.ultima_venta) : "Sin última venta registrada"}</small>
      </div>

      <div>
        <span>${e.mtd} / ${e.meta}</span>
        <small>${e.cumplimiento}%</small>
      </div>

      <div class="progress mini-progress">
        <span style="width:${limitar(e.cumplimiento)}%"></span>
      </div>
    </div>
  `).join("");
}

function renderAvisos(){
  const contenedor = document.getElementById("avisosLista");
  if(!contenedor) return;

  contenedor.innerHTML = datos.avisos.map(a => `
    <div class="card">
      <h3>${a.titulo}</h3>
      <p>${a.descripcion}</p>
    </div>
  `).join("");
}

function renderBiblioteca(){
  const contenedor = document.getElementById("bibliotecaLista");
  if(!contenedor) return;

  contenedor.innerHTML = datos.biblioteca.map(b => `
    <div class="card">
      <h3>${b.titulo}</h3>
      <p>${b.descripcion}</p>
      <a href="${b.url}" target="_blank">Abrir</a>
    </div>
  `).join("");
}

function renderPublicidad(){
  const contenedor = document.getElementById("publicidadLista");
  if(!contenedor) return;

  contenedor.innerHTML = datos.publicidad.map(p => `
    <div class="card">
      <h3>${p.titulo}</h3>
      <p>${p.descripcion}</p>
      <a href="${p.url}" target="_blank">Ver material</a>
    </div>
  `).join("");
}

function renderLinks(){
  const contenedor = document.getElementById("linksLista");
  if(!contenedor) return;

  contenedor.innerHTML = datos.links.map(l => `
    <div class="card">
      <h3>${l.nombre}</h3>
      <p>${l.categoria}</p>
      <a href="${l.url}" target="_blank">Abrir enlace</a>
    </div>
  `).join("");
}

function renderPrivado(){
  const liderEquipo = document.getElementById("liderEquipo");

  if(liderEquipo){
    liderEquipo.innerHTML = datos.equipo.map(e => `
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

        <p class="note">${e.ultima_venta ? "Última venta: " + formatearFecha(e.ultima_venta) : "Sin última venta registrada"}</p>
      </div>
    `).join("");
  }

  const rutasLista = document.getElementById("rutasLista");
  if(rutasLista){
    rutasLista.innerHTML = datos.rutas.map(r => `
      <div class="card">
        <h3>${r.dia}</h3>
        <p>${r.sector}</p>
        <small>${r.responsable}</small>
      </div>
    `).join("");
  }

  const reembolsosLista = document.getElementById("reembolsosLista");
  if(reembolsosLista){
    reembolsosLista.innerHTML = datos.reembolsos.map(r => `
      <div class="card">
        <h3>${r.ejecutivo}</h3>
        <p>Monto: ${r.monto}</p>
        <span class="badge yellow">${r.estado}</span>
      </div>
    `).join("");
  }
}

function cargarSelectEjecutivos(){
  const select = document.getElementById("ventaEjecutivo");
  if(!select || !datos.equipo) return;

  select.innerHTML = datos.equipo.map(e => `
    <option value="${e.nombre}">${e.nombre}</option>
  `).join("");

  const fecha = document.getElementById("ventaFecha");
  if(fecha && !fecha.value){
    fecha.value = fechaInputHoy();
  }
}

async function registrarVenta(){
  const estado = document.getElementById("ventaEstado");

  const fecha = document.getElementById("ventaFecha").value;
  const ejecutivo = document.getElementById("ventaEjecutivo").value;
  const cantidad = Number(document.getElementById("ventaCantidad").value || 0);
  const observacion = document.getElementById("ventaObservacion").value;

  if(!fecha || !ejecutivo || cantidad <= 0){
    estado.textContent = "Completa fecha, ejecutivo y cantidad.";
    return;
  }

  estado.textContent = "Guardando venta...";

  const payload = {
    action:"registrarVenta",
    fecha:formatoFechaChile(fecha),
    ejecutivo,
    cantidad,
    observacion,
    registradoPor:"Axel"
  };

  try{
    const res = await fetch(API_URL, {
      method:"POST",
      body:JSON.stringify(payload)
    });

    const result = await res.json();

    if(result.ok){
      estado.textContent = "Venta registrada correctamente.";
      document.getElementById("ventaCantidad").value = 1;
      document.getElementById("ventaObservacion").value = "";
      await actualizarDatos();
    }else{
      estado.textContent = result.message || "No se pudo guardar la venta.";
    }

  }catch(error){
    console.error(error);
    estado.textContent = "Error al guardar. Revisa Apps Script.";
  }
}

function fechaReporte(){
  const fecha = new Date();
  const dias = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];
  const meses = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];

  return `${dias[fecha.getDay()]} ${fecha.getDate()} de ${meses[fecha.getMonth()]} de ${fecha.getFullYear()}`;
}

function horaReporte(){
  return new Date().toLocaleTimeString("es-CL",{
    hour:"2-digit",
    minute:"2-digit",
    hour12:false
  });
}

function fechaCorta(){
  return `${fechaReporte()} · ${horaReporte()} hrs`;
}

function fechaInputHoy(){
  const hoy = new Date();
  const year = hoy.getFullYear();
  const month = String(hoy.getMonth() + 1).padStart(2,"0");
  const day = String(hoy.getDate()).padStart(2,"0");
  return `${year}-${month}-${day}`;
}

function formatoFechaChile(fechaISO){
  const partes = fechaISO.split("-");
  return `${partes[2]}-${partes[1]}-${partes[0]}`;
}

function formatearFecha(fecha){
  if(!fecha) return "";

  if(fecha instanceof Date){
    return fecha.toLocaleDateString("es-CL");
  }

  return String(fecha);
}

function primerNombre(nombre){
  return String(nombre || "").trim().split(" ")[0] || "";
}

function generarHTMLAvanceDia(){
  const d = datos.dashboard;

  return `
    <div class="share-card" id="cardDia">
      <div class="wom-report-card">

        <div class="wom-report-header">
          <div>
            <div class="wom-report-label">REPORTE COMERCIAL</div>
            <div class="wom-report-brand">WOM STREET CHILOÉ</div>
          </div>
          <div class="wom-logo">WOM</div>
        </div>

        <div class="wom-report-title">AVANCE DEL DÍA</div>

        <div class="wom-report-date">
          <span>📅 ${fechaReporte()}</span>
          <span>🕘 ${horaReporte()} hrs</span>
        </div>

        <div class="wom-main-box">
          <div class="wom-icon">📱</div>

          <div>
            <div class="wom-metric-label">Ventas día</div>
            <div class="wom-metric-number">${d.ventas_dia} / ${d.meta_dia}</div>
          </div>

          <div>
            <div class="wom-metric-label">Meta diaria</div>
            <div class="wom-small-number">${d.meta_dia}</div>
          </div>
        </div>

        <div class="wom-total-bar">
          <span>👥 Total equipo</span>
          <strong>${d.ventas_dia}</strong>
        </div>

        <div class="wom-section-title">👥 EQUIPO</div>

        <div class="wom-team-table">
          ${datos.equipo.map(e => `
            <div class="wom-team-row">
              <span>${primerNombre(e.nombre)}</span>
              <strong>${e.ventas_dia}</strong>
            </div>
          `).join("")}
        </div>

        <div class="wom-footer">
          <div class="wom-footer-star">★</div>
          <div class="wom-footer-title">WOM STREET CHILOÉ</div>
          <div class="wom-footer-sub">REPORTE COMERCIAL</div>
        </div>

      </div>
    </div>
  `;
}

function generarHTMLAvanceMensual(){
  const d = datos.dashboard;

  return `
    <div class="share-card" id="cardMes">
      <div class="wom-report-card">

        <div class="wom-report-header">
          <div>
            <div class="wom-report-label">REPORTE COMERCIAL</div>
            <div class="wom-report-brand">WOM STREET CHILOÉ</div>
          </div>
          <div class="wom-logo">WOM</div>
        </div>

        <div class="wom-report-title">AVANCE DEL MES</div>

        <div class="wom-report-date">
          <span>📅 ${fechaReporte()}</span>
          <span>🕘 ${horaReporte()} hrs</span>
        </div>

        <div class="wom-month-summary">
          <div class="wom-month-cell">
            <div class="wom-month-label">Ventas MTD</div>
            <div class="wom-month-number">${d.ventas_mtd} / ${d.meta_mes}</div>
            <div class="wom-month-sub">Meta mensual: ${d.meta_mes}</div>
          </div>

          <div class="wom-month-cell">
            <div class="wom-month-label">Cumplimiento</div>
            <div class="wom-month-percent">${d.cumplimiento_mes}%</div>
          </div>

          <div class="wom-month-cell">
            <div class="wom-month-label">FCST</div>
            <div class="wom-month-number">${d.fcst}</div>
            <div class="wom-month-sub">Proyección de cierre</div>
          </div>
        </div>

        <div class="wom-section-title">👥 EQUIPO</div>

        <div class="wom-table-head">
          <span>Ejecutivo</span>
          <span>Ventas MTD</span>
          <span>Meta Individual</span>
          <span>Cumplimiento</span>
        </div>

        ${datos.equipo.map(e => `
          <div class="wom-table-row">
            <span>${primerNombre(e.nombre)}</span>
            <strong>${e.mtd}</strong>
            <strong>${e.meta}</strong>
            <div class="wom-pill">${e.cumplimiento}%</div>
          </div>
        `).join("")}

        <div class="wom-month-total">
          <span>👥 TOTAL EQUIPO</span>
          <strong>${d.ventas_mtd} / ${d.meta_mes}</strong>
          <div class="wom-pill">${d.cumplimiento_mes}%</div>
        </div>

        <div class="wom-footer">
          <div class="wom-footer-star">★</div>
          <div class="wom-footer-title">WOM STREET CHILOÉ</div>
          <div class="wom-footer-sub">REPORTE COMERCIAL</div>
        </div>

      </div>
    </div>
  `;
}

async function descargarImagen(id, nombreArchivo){
  const elemento = document.getElementById(id);

  const canvas = await html2canvas(elemento,{
    scale:2,
    backgroundColor:null,
    useCORS:true
  });

  const blob = await new Promise(resolve => canvas.toBlob(resolve,"image/png"));
  const file = new File([blob], nombreArchivo, {type:"image/png"});

  if(navigator.canShare && navigator.canShare({files:[file]})){
    await navigator.share({
      files:[file],
      title:"WOM Street Chiloé",
      text:"Reporte comercial WOM Street Chiloé"
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
  await descargarImagen("cardDia","avance-dia-wom-street.png");
  area.innerHTML = "";
}

async function generarImagenAvanceMensual(){
  const area = document.getElementById("shareArea");
  area.innerHTML = generarHTMLAvanceMensual();
  await descargarImagen("cardMes","avance-mes-wom-street.png");
  area.innerHTML = "";
}

iniciar();