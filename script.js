const CODIGO_LIDER = "WSCHILOE2026";
let datos = {};

async function iniciar(){
  const datosGuardados = localStorage.getItem("womStreetDatos");

  if(datosGuardados){
    datos = JSON.parse(datosGuardados);
  }else{
    const respuesta = await fetch("datos.json");
    datos = await respuesta.json();
  }

  renderizarTodo();
}

function mostrar(id){
  document.querySelectorAll(".seccion").forEach(sec => {
    sec.classList.remove("activa");
  });
  document.getElementById(id).classList.add("activa");
}

function validarCodigo(){
  const codigo = document.getElementById("codigo").value;
  const error = document.getElementById("error");

  if(codigo === CODIGO_LIDER){
    document.getElementById("loginLider").style.display = "none";
    document.getElementById("panelLider").classList.remove("oculto");
    error.textContent = "";
    cargarFormulario();
  }else{
    error.textContent = "Código incorrecto";
  }
}

function porcentaje(valor, meta){
  if(!meta || meta === 0) return 0;
  return Math.round((valor / meta) * 100);
}

function colorEstado(p){
  if(p >= 90) return "verde";
  if(p >= 60) return "amarillo";
  return "rojo";
}

function textoEstado(p){
  if(p >= 90) return "Sobre meta";
  if(p >= 60) return "En riesgo";
  return "Bajo meta";
}

function renderizarTodo(){
  calcularIndicadores();
  renderHeader();
  renderKpis();
  renderEquipo();
  renderAvisos();
  renderBiblioteca();
  renderPublicidad();
  renderLinks();
  renderLider();
}

function calcularIndicadores(){
  datos.dashboard.cumplimiento_dia = porcentaje(datos.dashboard.ventas_dia, datos.dashboard.meta_dia);
  datos.dashboard.cumplimiento_mes = porcentaje(datos.dashboard.ventas_mtd, datos.dashboard.meta_mes);
  datos.dashboard.gap = datos.dashboard.ventas_mtd - datos.dashboard.meta_mes;
  datos.dashboard.diferencia_fcst = datos.dashboard.fcst - datos.dashboard.meta_mes;

  datos.equipo.forEach(e => {
    e.cumplimiento = porcentaje(e.mtd, e.meta);
    e.gap = e.mtd - e.meta;
  });
}

function renderHeader(){
  document.getElementById("ultimaActualizacion").textContent =
    "Última actualización: " + datos.ultima_actualizacion;
}

function kpiCard(titulo, valor, subtitulo, progreso){
  let barra = "";

  if(progreso !== undefined){
    barra = `
      <div class="barra">
        <span style="width:${Math.min(progreso,100)}%"></span>
      </div>
    `;
  }

  return `
    <div class="card">
      <div class="label">${titulo}</div>
      <div class="kpi">${valor}</div>
      <p>${subtitulo || ""}</p>
      ${barra}
    </div>
  `;
}

function renderKpis(){
  const d = datos.dashboard;

  document.getElementById("kpisDia").innerHTML = `
    ${kpiCard("Ventas del día", d.ventas_dia, "Gestión diaria")}
    ${kpiCard("Meta diaria", d.meta_dia, "Objetivo del día")}
    ${kpiCard("Cumplimiento diario", d.cumplimiento_dia + "%", textoEstado(d.cumplimiento_dia), d.cumplimiento_dia)}
  `;

  document.getElementById("kpisMes").innerHTML = `
    ${kpiCard("Ventas MTD", d.ventas_mtd, "Acumulado del mes")}
    ${kpiCard("Meta mensual", d.meta_mes, "Objetivo mensual")}
    ${kpiCard("Cumplimiento mes", d.cumplimiento_mes + "%", textoEstado(d.cumplimiento_mes), d.cumplimiento_mes)}
    ${kpiCard("GAP", d.gap, "Diferencia contra meta")}
  `;

  document.getElementById("kpisForecast").innerHTML = `
    ${kpiCard("FCST", d.fcst, "Proyección de cierre")}
    ${kpiCard("Diferencia FCST", d.diferencia_fcst, "Forecast vs meta")}
    <div class="card">
      <div class="label">Estado de cierre</div>
      <div class="kpi">
        <span class="estado ${colorEstado(porcentaje(d.fcst,d.meta_mes))}">
          ${textoEstado(porcentaje(d.fcst,d.meta_mes))}
        </span>
      </div>
      <p>Según la proyección actual.</p>
    </div>
  `;
}

function renderEquipo(){
  document.getElementById("tablaEquipo").innerHTML = datos.equipo.map(e => `
    <tr>
      <td>${e.nombre}</td>
      <td>${e.ventas_dia}</td>
      <td>${e.mtd}</td>
      <td>${e.meta}</td>
      <td>${e.cumplimiento}%</td>
      <td><span class="estado ${colorEstado(e.cumplimiento)}">${textoEstado(e.cumplimiento)}</span></td>
    </tr>
  `).join("");
}

function renderAvisos(){
  document.getElementById("avisosLista").innerHTML = datos.avisos.map(a => `
    <div class="card">
      <h3>📌 ${a.titulo}</h3>
      <p>${a.descripcion}</p>
    </div>
  `).join("");
}

function renderBiblioteca(){
  document.getElementById("bibliotecaLista").innerHTML = datos.biblioteca.map(b => `
    <div class="card">
      <h3>${b.titulo}</h3>
      <p>${b.descripcion}</p>
      <a href="${b.url}" target="_blank">Abrir</a>
    </div>
  `).join("");
}

function renderPublicidad(){
  document.getElementById("publicidadLista").innerHTML = datos.publicidad.map(p => `
    <div class="card">
      <h3>${p.titulo}</h3>
      <p>${p.descripcion}</p>
      <a href="${p.url}" target="_blank">Ver material</a>
    </div>
  `).join("");
}

function renderLinks(){
  document.getElementById("linksLista").innerHTML = datos.links.map(l => `
    <div class="card">
      <h3>${l.nombre}</h3>
      <p>${l.categoria}</p>
      <a href="${l.url}" target="_blank">Abrir enlace</a>
    </div>
  `).join("");
}

function renderLider(){
  document.getElementById("tablaLider").innerHTML = datos.equipo.map(e => `
    <tr>
      <td>${e.nombre}</td>
      <td>${e.ventas_dia}</td>
      <td>${e.mtd}</td>
      <td>${e.meta}</td>
      <td>${e.gap}</td>
      <td>${e.cumplimiento}%</td>
      <td>${e.observacion}</td>
    </tr>
  `).join("");

  document.getElementById("rutasLista").innerHTML = datos.rutas.map(r => `
    <div class="card">
      <h3>${r.dia}</h3>
      <p>${r.sector}</p>
      <small>Responsable: ${r.responsable}</small>
    </div>
  `).join("");

  document.getElementById("reembolsosLista").innerHTML = datos.reembolsos.map(r => `
    <div class="card">
      <h3>${r.ejecutivo}</h3>
      <p>Monto: ${r.monto}</p>
      <span class="estado amarillo">${r.estado}</span>
    </div>
  `).join("");
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
  datos.dashboard.ventas_dia = Number(document.getElementById("formVentasDia").value);
  datos.dashboard.meta_dia = Number(document.getElementById("formMetaDia").value);
  datos.dashboard.ventas_mtd = Number(document.getElementById("formVentasMTD").value);
  datos.dashboard.meta_mes = Number(document.getElementById("formMetaMes").value);
  datos.dashboard.fcst = Number(document.getElementById("formFcst").value);

  datos.ultima_actualizacion = new Date().toLocaleString("es-CL");

  localStorage.setItem("womStreetDatos", JSON.stringify(datos));
  renderizarTodo();
  alert("Datos actualizados en este dispositivo.");
}

iniciar();