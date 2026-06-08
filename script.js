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

  if(dashboardFinal.ventas_mtd === 0 && ventasMTDEqu