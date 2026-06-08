const CODIGO_LIDER = "WSCHILOE2026";
const API_URL = "https://script.google.com/macros/s/AKfycbxP2L869vhRVma1iNcwDEY8sV8X7OunPWuve4ot0BDr3v9fJFZmvhvZWjo2suF3cJsKdw/exec";

let datos = {};

function numero(valor){
  const n = Number(valor);
  return isNaN(n) ? 0 : n;
}

function porcentaje(valor){
  const n = numero(valor);
  return n <= 2 ? n * 100 : n;
}

function formatoNumero(valor){
  return Math.round(numero(valor));
}

function formatoPorcentaje(valor){
  return porcentaje(valor).toFixed(2).replace(".", ",") + "%";
}

function color(p){
  p = porcentaje(p);
  if(p >= 120) return "purple";
  if(p >= 100) return "green";
  if(p >= 80) return "yellow";
  return "red";
}

function estadoTexto(p){
  p = porcentaje(p);
  if(p >= 120) return "Excelente";
  if(p >= 100) return "Sobre meta";
  if(p >= 80) return "En riesgo";
  return "Bajo meta";
}

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
    console.error(error);
    alert("No se pudieron actualizar los datos.");
  }finally{
    if(boton){
      boton.textContent = "🔄 Actualizar";
      boton.disabled = false;
    }
  }
}

function transformarDatos(data){
  const resumen = data.resumen_control || {};

  const resumenFinal = {
    total_pp: numero(resumen["Total PP"]),
    meta_mensual: numero(resumen["Meta mensual"]),
    deberian_llevar: numero(resumen["Deberían llevar"]),
    gap: numero(resumen["GAP"]),
    proyeccion_equipo: porcentaje(resumen["Proyección lineal equipo"]),
    fcst: numero(resumen["FCST"]),
    fcst_vs_meta: porcentaje(resumen["FCST vs Meta"]),
    total_prospectos: numero(resumen["Total prospectos"]),
    estado_equipo: resumen["Estado equipo"] || estadoTexto(resumen["Proyección lineal equipo"]),
    estado_fcst: resumen["Estado FCST"] || estadoTexto(resumen["FCST vs Meta"])
  };

  const filasResumen = [
    "Total PP",
    "Meta mensual",
    "Deberían llevar",
    "GAP",
    "Proyección lineal equipo",
    "FCST",
    "FCST vs Meta",
    "Total prospectos",
    "Estado equipo",
    "Estado FCST"
  ];

  const equipo = (data.control_diario || [])
    .filter(e => {
      const nombre = String(e["Ejecutivo"] || "").trim();
      return nombre && !filasResumen.includes(nombre);
    })
    .map(e => ({
      ejecutivo: String(e["Ejecutivo"] || "").trim(),
      pp: numero(e["PP"]),
      proyeccion: porcentaje(e["Proyección Lineal"] || e["Proyeccion Lineal"]),
      prospectos: numero(e["Prospectos Ingresados"] || e["Prospectos"]),
      estado: e["Estado"] || estadoTexto(e["Proyección Lineal"] || e["Proyeccion Lineal"])
    }))
    .filter(e => e.ejecutivo);

  equipo.sort((a,b) => b.proyeccion - a.proyeccion);

  return {
    resumen: resumenFinal,
    equipo,
    avisos: data.avisos || [],
    biblioteca: data.biblioteca || [],
    publicidad: data.publicidad || [],
    links: data.links || [],
    rutas: data.rutas || [],
    reembolsos: data.reembolsos || [],
    historial: data.historial || []
  };
}

function renderTodo(){
  renderHeader();
  renderResumen();
  renderRanking();
  renderOperacion();
  renderLider();
}

function renderHeader(){
  const el = document.getElementById("ultimaActualizacion");
  if(el){
    el.textContent = "Actualizado: " + fechaCorta();
  }
}

function renderResumen(){
  const r = datos.resumen;

  setText("totalPP", formatoNumero(r.total_pp));
  setText("metaMensual", formatoNumero(r.meta_mensual));
  setText("deberianLlevar", formatoNumero(r.deberian_llevar));
  setText("gapEquipo", r.gap);
  setText("proyeccionEquipo", formatoPorcentaje(r.proyeccion_equipo));
  setText("fcst", formatoNumero(r.fcst));
  setText("fcstVsMeta", formatoPorcentaje(r.fcst_vs_meta));
  setText("totalProspectos", formatoNumero(r.total_prospectos));

  setWidth("barraPP", porcentaje(r.total_pp / r.meta_mensual));
  setWidth("barraProyeccion", r.proyeccion_equipo);

  const estadoEquipo = document.getElementById("estadoEquipo");
  if(estadoEquipo){
    estadoEquipo.textContent = r.estado_equipo;
    estadoEquipo.className = "badge " + color(r.proyeccion_equipo);
  }

  const estadoFcst = document.getElementById("estadoFcst");
  if(estadoFcst){
    estadoFcst.textContent = r.estado_fcst;
    estadoFcst.className = "badge " + color(r.fcst_vs_meta);
  }
}

function renderRanking(){
  const contenedor = document.getElementById("rankingEquipo");
  if(!contenedor) return;

  contenedor.innerHTML = datos.equipo.map((e, index) => `
    <div class="ranking-card">
      <div class="ranking-position">${medalla(index)}</div>

      <div class="ranking-info">
        <strong>${e.ejecutivo}</strong>
        <span>PP ${e.pp} · Prospectos ${e.prospectos}</span>
        <div class="progress">
          <span style="width:${Math.min(e.proyeccion,100)}%"></span>
        </div>
      </div>

      <div class="ranking-result">
        <strong>${formatoPorcentaje(e.proyeccion)}</strong>
        <span class="badge ${color(e.proyeccion)}">${e.estado}</span>
      </div>
    </div>
  `).join("");
}

function renderOperacion(){
  renderCards("avisosLista", datos.avisos, "aviso");
  renderCards("bibliotecaLista", datos.biblioteca, "biblioteca");
  renderCards("publicidadLista", datos.publicidad, "publicidad");
  renderCards("linksLista", datos.links, "links");
}

function renderCards(id, lista, tipo){
  const contenedor = document.getElementById(id);
  if(!contenedor) return;

  contenedor.innerHTML = (lista || []).map(item => {
    const titulo = item["Título"] || item["Titulo"] || item["Nombre"] || item["Día"] || item["Dia"] || item["Fecha"] || "Sin título";
    const descripcion = item["Descripción"] || item["Descripcion"] || item["Categoría"] || item["Categoria"] || item["Sector"] || "";
    const url = item["Link"] || item["URL"] || "";

    return `
      <div class="card">
        <h3>${icono(tipo)} ${titulo}</h3>
        <p>${descripcion}</p>
        ${url ? `<a href="${url}" target="_blank">Abrir</a>` : ""}
      </div>
    `;
  }).join("");
}

function renderLider(){
  const r = datos.resumen;

  const liderResumen = document.getElementById("liderResumen");
  if(liderResumen){
    liderResumen.innerHTML = `
      ${miniKpi("Total PP", formatoNumero(r.total_pp), "Meta " + formatoNumero(r.meta_mensual))}
      ${miniKpi("GAP", r.gap, "Contra deberían llevar")}
      ${miniKpi("Proyección", formatoPorcentaje(r.proyeccion_equipo), r.estado_equipo)}
      ${miniKpi("FCST", formatoNumero(r.fcst), formatoPorcentaje(r.fcst_vs_meta))}
      ${miniKpi("Prospectos", formatoNumero(r.total_prospectos), "Total equipo")}
    `;
  }

  const liderEquipo = document.getElementById("liderEquipo");
  if(liderEquipo){
    liderEquipo.innerHTML = document.getElementById("rankingEquipo")?.innerHTML || "";
  }

  const rutasLista = document.getElementById("rutasLista");
  if(rutasLista){
    rutasLista.innerHTML = (datos.rutas || []).map(r => `
      <div class="card">
        <h3>📍 ${r["Día"] || r["Dia"] || r["Fecha"] || "Ruta"}</h3>
        <p>${r["Sector"] || ""}</p>
        <small>${r["Responsable"] || ""}</small>
      </div>
    `).join("");
  }

  const reembolsosLista = document.getElementById("reembolsosLista");
  if(reembolsosLista){
    reembolsosLista.innerHTML = (datos.reembolsos || []).map(r => `
      <div class="card">
        <h3>💳 ${r["Ejecutivo"] || "Reembolso"}</h3>
        <p>Monto: ${r["Monto"] || ""}</p>
        <span class="badge yellow">${r["Estado"] || ""}</span>
      </div>
    `).join("");
  }
}

function miniKpi(titulo, valor, subtitulo){
  return `
    <div class="card">
      <div class="kpi-title">${titulo}</div>
      <div class="kpi-value">${valor}</div>
      <p class="kpi-sub">${subtitulo || ""}</p>
    </div>
  `;
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
  }else{
    error.textContent = "Código incorrecto";
  }
}

function setText(id, value){
  const el = document.getElementById(id);
  if(el) el.textContent = value;
}

function setWidth(id, value){
  const el = document.getElementById(id);
  if(el) el.style.width = Math.min(Math.max(porcentaje(value),0),100) + "%";
}

function medalla(index){
  if(index === 0) return "🥇";
  if(index === 1) return "🥈";
  if(index === 2) return "🥉";
  return index + 1;
}

function icono(tipo){
  if(tipo === "biblioteca") return "📚";
  if(tipo === "publicidad") return "📢";
  if(tipo === "links") return "🔗";
  return "📌";
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

function generarHTMLAvanceDia(){
  const r = datos.resumen;

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

        <div class="wom-report-title">AVANCE DIARIO</div>

        <div class="wom-report-date">
          <span>📅 ${fechaReporte()}</span>
          <span>🕘 ${horaReporte()} hrs</span>
        </div>

        <div class="wom-month-summary">
          <div class="wom-month-cell">
            <div class="wom-month-label">Total PP</div>
            <div class="wom-month-number">${formatoNumero(r.total_pp)}</div>
            <div class="wom-month-sub">Meta ${formatoNumero(r.meta_mensual)}</div>
          </div>

          <div class="wom-month-cell">
            <div class="wom-month-label">GAP</div>
            <div class="wom-month-number">${r.gap}</div>
            <div class="wom-month-sub">Contra deberían llevar</div>
          </div>

          <div class="wom-month-cell">
            <div class="wom-month-label">Proyección</div>
            <div class="wom-month-number">${formatoPorcentaje(r.proyeccion_equipo)}</div>
            <div class="wom-month-sub">${r.estado_equipo}</div>
          </div>
        </div>

        <div class="wom-section-title">Ranking equipo</div>

        ${datos.equipo.map((e,index) => `
          <div class="wom-team-row">
            <span>${medalla(index)} ${e.ejecutivo}</span>
            <strong>${formatoPorcentaje(e.proyeccion)}</strong>
          </div>
        `).join("")}

        <div class="wom-footer">
          <div class="wom-footer-star">★</div>
          <div class="wom-footer-title">WOM STREET CHILOÉ</div>
          <div class="wom-footer-sub">CONTROL COMERCIAL DIARIO</div>
        </div>
      </div>
    </div>
  `;
}

function generarHTMLAvanceMensual(){
  const r = datos.resumen;

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

        <div class="wom-report-title">PROYECCIÓN MENSUAL</div>

        <div class="wom-report-date">
          <span>📅 ${fechaReporte()}</span>
          <span>🕘 ${horaReporte()} hrs</span>
        </div>

        <div class="wom-month-summary">
          <div class="wom-month-cell">
            <div class="wom-month-label">FCST</div>
            <div class="wom-month-number">${formatoNumero(r.fcst)}</div>
            <div class="wom-month-sub">${formatoPorcentaje(r.fcst_vs_meta)} vs meta</div>
          </div>

          <div class="wom-month-cell">
            <div class="wom-month-label">Meta</div>
            <div class="wom-month-number">${formatoNumero(r.meta_mensual)}</div>
            <div class="wom-month-sub">Mensual</div>
          </div>

          <div class="wom-month-cell">
            <div class="wom-month-label">Prospectos</div>
            <div class="wom-month-number">${formatoNumero(r.total_prospectos)}</div>
            <div class="wom-month-sub">Ingresados</div>
          </div>
        </div>

        <div class="wom-section-title">Equipo</div>

        ${datos.equipo.map(e => `
          <div class="wom-table-row">
            <span>${e.ejecutivo}</span>
            <strong>${e.pp} PP</strong>
            <strong>${e.prospectos} Prospectos</strong>
            <div class="wom-pill">${formatoPorcentaje(e.proyeccion)}</div>
          </div>
        `).join("")}

        <div class="wom-footer">
          <div class="wom-footer-star">★</div>
          <div class="wom-footer-title">WOM STREET CHILOÉ</div>
          <div class="wom-footer-sub">CONTROL COMERCIAL MENSUAL</div>
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
  await descargarImagen("cardDia","avance-diario-wom-street.png");
  area.innerHTML = "";
}

async function generarImagenAvanceMensual(){
  const area = document.getElementById("shareArea");
  area.innerHTML = generarHTMLAvanceMensual();
  await descargarImagen("cardMes","avance-mensual-wom-street.png");
  area.innerHTML = "";
}

iniciar();