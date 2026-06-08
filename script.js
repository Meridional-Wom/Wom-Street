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

function normalizar(texto){
  return String(texto || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g,"")
    .replace(/\s+/g," ")
    .trim();
}

function obtener(obj, nombres){
  if(!obj) return "";
  const claves = Object.keys(obj);

  for(const nombre of nombres){
    const buscado = normalizar(nombre);
    const clave = claves.find(k => normalizar(k) === buscado);
    if(clave && obj[clave] !== "" && obj[clave] !== null && obj[clave] !== undefined){
      return obj[clave];
    }
  }

  return "";
}

function numero(valor){
  if(valor === "" || valor === null || valor === undefined) return 0;

  if(typeof valor === "string"){
    valor = valor.replace(",", ".").replace("%", "").trim();
  }

  const n = Number(valor);
  return isNaN(n) ? 0 : n;
}

function formatoFecha(valor){
  if(!valor) return fechaCorta();

  const fecha = new Date(valor);

  if(!isNaN(fecha.getTime())){
    return fecha.toLocaleDateString("es-CL",{
      day:"2-digit",
      month:"2-digit",
      year:"numeric"
    }) + " " + fecha.toLocaleTimeString("es-CL",{
      hour:"2-digit",
      minute:"2-digit",
      hour12:false
    }) + " hrs";
  }

  return valor;
}

function transformarDatos(data){
  const dashboard = data.dashboard || {};

  const equipo = (data.equipo || []).map(e => ({
    nombre: obtener(e, ["Ejecutivo"]),
    ventas_dia: numero(obtener(e, ["Ventas Día","Ventas Dia","Ventas día","Hoy"])),
    mtd: numero(obtener(e, ["Ventas MTD","MTD"])),
    meta: numero(obtener(e, ["Meta Mes","Meta mes","Meta"])),
    observacion: obtener(e, ["Observación","Observacion"])
  })).filter(e => e.nombre);

  const ventasDiaEquipo = equipo.reduce((total, e) => total + e.ventas_dia, 0);
  const ventasMTDEquipo = equipo.reduce((total, e) => total + e.mtd, 0);

  const dashboardFinal = {
    ventas_dia: numero(obtener(dashboard, ["Ventas día","Ventas Día","Ventas dia","Ventas Dia"])),
    meta_dia: numero(obtener(dashboard, ["Meta día","Meta Día","Meta dia","Meta Dia"])),
    ventas_mtd: numero(obtener(dashboard, ["Ventas MTD","MTD","Ventas acumuladas"])),
    meta_mes: numero(obtener(dashboard, ["Meta mes","Meta Mes","Meta mensual"])),
    fcst: numero(obtener(dashboard, ["FCST","FCST manual","FCST Manual","Forecast","FCST auto"]))
  };

  if(dashboardFinal.ventas_dia === 0 && ventasDiaEquipo > 0){
    dashboardFinal.ventas_dia = ventasDiaEquipo;
  }

  if(dashboardFinal.ventas_mtd === 0 && ventasMTDEquipo > 0){
    dashboardFinal.ventas_mtd = ventasMTDEquipo;
  }

  return {
    ultima_actualizacion: obtener(dashboard, [
      "Última actualización",
      "Ultima actualización",
      "Actualización",
      "Fecha actualización"
    ]),

    dashboard: dashboardFinal,
    equipo: equipo,

    avisos:(data.avisos || []).map(a => ({
      titulo: obtener(a, ["Título","Titulo"]),
      descripcion: obtener(a, ["Descripción","Descripcion"])
    })).filter(a => a.titulo || a.descripcion),

    biblioteca:(data.biblioteca || []).map(b => ({
      titulo: obtener(b, ["Título","Titulo","Nombre"]),
      descripcion: obtener(b, ["Descripción","Descripcion","Categoría","Categoria"]),
      url: obtener(b, ["Link","URL"]) || "#"
    })).filter(b => b.titulo || b.descripcion),

    publicidad:(data.publicidad || []).map(p => ({
      titulo: obtener(p, ["Título","Titulo","Nombre"]),
      descripcion: obtener(p, ["Descripción","Descripcion"]),
      url: obtener(p, ["Link","URL"]) || "#"
    })).filter(p => p.titulo || p.descripcion),

    links:(data.links || []).map(l => ({
      nombre: obtener(l, ["Nombre"]),
      categoria: obtener(l, ["Categoría","Categoria"]),
      url: obtener(l, ["URL","Link"]) || "#"
    })).filter(l => l.nombre),

    rutas:(data.rutas || []).map(r => ({
      dia: obtener(r, ["Día","Dia","Fecha"]),
      sector: obtener(r, ["Sector"]),
      responsable: obtener(r, ["Responsable"])
    })).filter(r => r.dia || r.sector),

    reembolsos:(data.reembolsos || []).map(r => ({
      ejecutivo: obtener(r, ["Ejecutivo"]),
      monto: obtener(r, ["Monto"]),
      estado: obtener(r, ["Estado"])
    })).filter(r => r.ejecutivo || r.monto)
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
  }else{
    error.textContent = "Código incorrecto";
  }
}

function porcentaje(valor, meta){
  if(!meta || meta === 0) return 0;
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
  const el = document.getElementById("ultimaActualizacion");
  if(el){
    el.textContent = "Actualizado: " + formatoFecha(datos.ultima_actualizacion);
  }
}

function kpi(titulo, valor, subtitulo, progreso){
  const barra = progreso !== undefined
    ? `<div class="progress"><span style="width:${Math.min(Math.max(progreso,0),100)}%"></span></div>`
    : "";

  return `
    <div class="card">
      <div class="kpi-title">${titulo}</div>
      <div class="kpi-value">${valor}</div>
      <p class="kpi-sub">${subtitulo || ""}</p>
      ${barra}
    </div>
  `;
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
      <div class="kpi-value">
        <span class="badge ${color(d.estado_fcst)}">${estado(d.estado_fcst)}</span>
      </div>
      <p class="kpi-sub">Según la proyección actual</p>
    </div>
  `;
}

function renderEquipo(){
  const contenedor = document.getElementById("equipoCards");
  if(!contenedor) return;

  contenedor.innerHTML = datos.equipo.map(e => `
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
          <div class="mini"><span>GAP</span><strong>${e.gap}</strong></div>
        </div>

        <p>${e.observacion}</p>
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

function primerNombre(nombre){
  return String(nombre || "").trim().split(" ")[0] || "";
}

function estilosReporte(){
  return `
    font-family: Arial, Helvetica, sans-serif;
    box-sizing: border-box;
  `;
}

function filaReporte(nombre, valor){
  return `
    <div style="
      display:flex;
      justify-content:space-between;
      align-items:center;
      border-bottom:2px solid #eeeaf5;
      padding:18px 0;
      font-size:32px;
      color:#161226;
    ">
      <span>${nombre}</span>
      <strong style="color:#35108f;">${valor}</strong>
    </div>
  `;
}

function generarHTMLAvanceDia(){
  const d = datos.dashboard;

  return `
    <div id="cardDia" style="
      ${estilosReporte()}
      width:1080px;
      height:1080px;
      background:linear-gradient(135deg,#25006d 0%,#35108f 45%,#681df2 78%,#ff2f93 100%);
      padding:64px;
      position:fixed;
      left:-9999px;
      top:0;
    ">
      <div style="
        width:100%;
        height:100%;
        background:#ffffff;
        border-radius:48px;
        padding:58px;
        display:flex;
        flex-direction:column;
      ">
        <div style="
          display:flex;
          justify-content:space-between;
          align-items:flex-start;
          border-bottom:2px solid #eeeaf5;
          padding-bottom:28px;
        ">
          <div>
            <div style="
              color:#ff2f93;
              font-size:22px;
              font-weight:900;
              letter-spacing:3px;
            ">REPORTE COMERCIAL</div>

            <div style="
              color:#35108f;
              font-size:36px;
              font-weight:900;
              margin-top:8px;
            ">WOM STREET CHILOÉ</div>
          </div>

          <div style="
            color:#706989;
            font-size:26px;
            font-weight:900;
          ">${horaReporte()} hrs</div>
        </div>

        <div style="
          color:#35108f;
          font-size:76px;
          font-weight:900;
          margin:42px 0 28px;
          line-height:1;
        ">AVANCE</div>

        <div style="
          background:#f4f0fb;
          border-radius:30px;
          padding:34px 40px;
          display:flex;
          justify-content:space-between;
          align-items:center;
          margin-bottom:44px;
        ">
          <div>
            <div style="
              color:#706989;
              font-size:28px;
              font-weight:900;
              margin-bottom:8px;
            ">Ventas día / Meta día</div>

            <div style="
              color:#35108f;
              font-size:82px;
              font-weight:900;
              line-height:1;
            ">${d.ventas_dia} / ${d.meta_dia}</div>
          </div>

          <div style="
            color:#161226;
            font-size:30px;
            font-weight:900;
          ">Gestión diaria</div>
        </div>

        <div style="
          color:#35108f;
          font-size:30px;
          font-weight:900;
          margin-bottom:14px;
        ">Equipo</div>

        <div>
          ${datos.equipo.map(e => filaReporte(primerNombre(e.nombre), e.ventas_dia)).join("")}
        </div>

        <div style="
          margin-top:auto;
          display:flex;
          justify-content:space-between;
          align-items:center;
          color:#706989;
          font-size:28px;
          font-weight:900;
          padding-top:26px;
        ">
          <span>Total equipo: ${d.ventas_dia}</span>
          <span>Actualizado ${horaReporte()} hrs</span>
        </div>
      </div>
    </div>
  `;
}

function generarHTMLAvanceMensual(){
  const d = datos.dashboard;

  return `
    <div id="cardMes" style="
      ${estilosReporte()}
      width:1080px;
      height:1080px;
      background:linear-gradient(135deg,#25006d 0%,#35108f 45%,#681df2 78%,#ff2f93 100%);
      padding:64px;
      position:fixed;
      left:-9999px;
      top:0;
    ">
      <div style="
        width:100%;
        height:100%;
        background:#ffffff;
        border-radius:48px;
        padding:58px;
        display:flex;
        flex-direction:column;
      ">
        <div style="
          display:flex;
          justify-content:space-between;
          align-items:flex-start;
          border-bottom:2px solid #eeeaf5;
          padding-bottom:28px;
        ">
          <div>
            <div style="
              color:#ff2f93;
              font-size:22px;
              font-weight:900;
              letter-spacing:3px;
            ">REPORTE COMERCIAL</div>

            <div style="
              color:#35108f;
              font-size:36px;
              font-weight:900;
              margin-top:8px;
            ">WOM STREET CHILOÉ</div>
          </div>

          <div style="
            color:#706989;
            font-size:26px;
            font-weight:900;
          ">${horaReporte()} hrs</div>
        </div>

        <div style="
          color:#35108f;
          font-size:70px;
          font-weight:900;
          margin:42px 0 28px;
          line-height:1;
        ">AVANCE MENSUAL</div>

        <div style="
          background:#f4f0fb;
          border-radius:30px;
          padding:34px 40px;
          display:flex;
          justify-content:space-between;
          align-items:center;
          margin-bottom:44px;
        ">
          <div>
            <div style="
              color:#706989;
              font-size:28px;
              font-weight:900;
              margin-bottom:8px;
            ">Ventas MTD / Meta mensual</div>

            <div style="
              color:#35108f;
              font-size:82px;
              font-weight:900;
              line-height:1;
            ">${d.ventas_mtd} / ${d.meta_mes}</div>
          </div>

          <div style="text-align:right;">
            <div style="
              color:#ff2f93;
              font-size:64px;
              font-weight:900;
              line-height:1;
            ">${d.cumplimiento_mes}%</div>

            <div style="
              color:#706989;
              font-size:24px;
              font-weight:900;
              margin-top:8px;
            ">Cumplimiento</div>

            <div style="
              color:#161226;
              font-size:28px;
              font-weight:900;
            ">FCST: ${d.fcst}</div>
          </div>
        </div>

        <div style="
          color:#35108f;
          font-size:30px;
          font-weight:900;
          margin-bottom:14px;
        ">Equipo</div>

        <div>
          ${datos.equipo.map(e => filaReporte(
            primerNombre(e.nombre),
            `${e.mtd} / ${e.meta} (${e.cumplimiento}%)`
          )).join("")}
        </div>

        <div style="
          margin-top:auto;
          display:flex;
          justify-content:space-between;
          align-items:center;
          color:#706989;
          font-size:28px;
          font-weight:900;
          padding-top:26px;
        ">
          <span>Total equipo: ${d.ventas_mtd} / ${d.meta_mes}</span>
          <span>${d.cumplimiento_mes}% mensual</span>
        </div>
      </div>
    </div>
  `;
}

async function descargarImagen(id, nombreArchivo){
  const elemento = document.getElementById(id);

  const canvas = await html2canvas(elemento,{
    scale:2,
    backgroundColor:"#ffffff",
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