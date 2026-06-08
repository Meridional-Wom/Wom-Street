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
  const boton = document.querySelector(".refresh-button");

  if(boton){
    boton.innerHTML = "⏳ <span>Actualizando...</span>";
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
      boton.innerHTML = "🔄 <span>Actualizar datos</span>";
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
      observacion:e["Observación"] || e["Observacion"] || ""
    })),

    avisos:(data.avisos || []).map(a => ({
      titulo:a["Título"] || a["Titulo"] || "",
      descripcion:a["Descripción"] || a["Descripcion"] || "",
      fecha:a["Fecha"] || "",
      prioridad:a["Prioridad"] || ""
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
      responsable:r["Responsable"] || "",
      estado:r["Estado"] || ""
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

function limitarPorcentaje(p){
  return Math.min(Math.max(p,0),100);
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
  d.cumplimiento_fcst = porcentaje(d.fcst, d.meta_mes);
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
  renderDashboardEjecutivo();
  renderVentasDia();
  renderEquipo();
  renderAvisos();
  renderBiblioteca();
  renderPublicidad();
  renderLinks();
  renderPrivado();
}

function renderHeader(){
  document.getElementById("fechaPrincipal").textContent =
    fechaReporte() + " · " + horaReporte() + " hrs";
}

function renderDashboardEjecutivo(){
  const d = datos.dashboard;

  document.getElementById("ventasDiaHero").textContent = d.ventas_dia;
  document.getElementById("metaDiaHero").textContent = "Meta diaria: " + d.meta_dia;
  document.getElementById("porcentajeDiaHero").textContent = d.cumplimiento_dia + "%";
  document.getElementById("barDiaHero").style.width = limitarPorcentaje(d.cumplimiento_dia) + "%";

  document.getElementById("ventasMtdHero").textContent = d.ventas_mtd;
  document.getElementById("metaMesHero").textContent = "Meta mensual: " + d.meta_mes;
  document.getElementById("porcentajeMesHero").textContent = d.cumplimiento_mes + "%";
  document.getElementById("barMesHero").style.width = limitarPorcentaje(d.cumplimiento_mes) + "%";

  document.getElementById("fcstHero").textContent = d.fcst;
  document.getElementById("porcentajeFcstHero").textContent = d.cumplimiento_fcst + "%";
  document.getElementById("barFcstHero").style.width = limitarPorcentaje(d.cumplimiento_fcst) + "%";

  document.getElementById("cumplimientoHero").textContent = d.cumplimiento_mes + "%";
  document.getElementById("cumplimientoMiniHero").textContent = d.cumplimiento_mes + "%";
  document.getElementById("barCumplimientoHero").style.width = limitarPorcentaje(d.cumplimiento_mes) + "%";

  document.getElementById("metaMensualTexto").textContent = d.ventas_mtd + " / " + d.meta_mes;
  document.getElementById("gapTexto").textContent = "Diferencia contra meta: " + d.gap;
  document.getElementById("barraMes").style.width = limitarPorcentaje(d.cumplimiento_mes) + "%";
  document.getElementById("circlePercent").textContent = d.cumplimiento_mes + "%";

  const grados = limitarPorcentaje(d.cum