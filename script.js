function ocultarLoader(){
  const loader = document.getElementById("loader");

  if(loader){
    loader.style.opacity = "0";
    setTimeout(() => {
      loader.style.display = "none";
    }, 400);
  }
}

const CODIGO_LIDER = "WSCHILOE2026";

const API_URL = "https://script.google.com/macros/s/AKfycbxP2L869vhRVma1iNcwDEY8sV8X7OunPWuve4ot0BDr3v9fJFZmvhvZWjo2suF3cJsKdw/exec";

let datos = {};

async function iniciar(){
  try{
    const res = await fetch(API_URL + "?t=" + Date.now());
    const data = await res.json();

    datos = transformarDatos(data);
    renderTodo();

    ocultarLoader();

  }catch(error){
    console.error(error);
    ocultarLoader();
    alert("No se pudieron cargar los datos desde Google Sheets.");
  }
}

function transformarDatos(data){
  const dashboard = data.dashboard || {};

  return {
    ultima_actualizacion: dashboard["Última actualización"] || "",

    dashboard: {
      ventas_dia: Number(dashboard["Ventas día"] || 0),
      meta_dia: Number(dashboard["Meta día"] || 0),
      ventas_mtd: Number(dashboard["Ventas MTD"] || 0),
      meta_mes: Number(dashboard["Meta mes"] || 0),
      fcst: Number(dashboard["FCST"] || dashboard["FCST manual"] || 0)
    },

    equipo: (data.equipo || []).map(e => ({
      nombre: e["Ejecutivo"] || "",
      ventas_dia: Number(e["Ventas Día"] || 0),
      mtd: Number(e["Ventas MTD"] || 0),
      meta: Number(e["Meta Mes"] || 0),
      observacion: e["Observación"] || ""
    })),

    avisos: (data.avisos || []).map(a => ({
      titulo: a["Título"] || "",
      descripcion: a["Descripción"] || ""
    })),

    biblioteca: (data.biblioteca || []).map(b => ({
      titulo: b["Título"] || "",
      descripcion: b["Descripción"] || "",
      url: b["Link"] || "#"
    })),

    publicidad: (data.publicidad || []).map(p => ({
      titulo: p["Título"] || "",
      descripcion: p["Descripción"] || "",
      url: p["Link"] || "#"
    })),

    links: (data.links || []).map(l => ({
      nombre: l["Nombre"] || "",
      categoria: l["Categoría"] || "",
      url: l["URL"] || "#"
    })),

    rutas: (data.rutas || []).map(r => ({
      dia: r["Día"] || r["Fecha"] || "",
      sector: r["Sector"] || "",
      responsable: r["Responsable"] || ""
    })),

    reembolsos: (data.reembolsos || []).map(r => ({
      ejecutivo: r["Ejecutivo"] || "",
      monto: r["Monto"] || "",
      estado: r["Estado"] || ""
    }))
  };
}

function mostrar(id){
  document.querySelectorAll(".section").forEach(s => {
    s.classList.remove("active");
  });

  const seccion = document.getElementById(id);

  if(seccion){
    seccion.classList.add("active");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

function validarCodigo(){
  const codigo = document.getElementById("codigo").value.trim();
  const error = document.getElementById("error");

  if(codigo === CODIGO_LIDER){
    document.getElementById("loginLider").classList.add("hidden");
    document.getElement