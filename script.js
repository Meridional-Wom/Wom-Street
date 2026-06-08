function aplicarVisibilidadModulos(){
  if(!datos.modulos || datos.modulos.length === 0) return;

  datos.modulos.forEach(m => {
    const moduloHoja = normalizar(m.nombre);
    const visible = ["si","sí","yes","true","1"].includes(normalizar(m.visible));

    document.querySelectorAll("[data-modulo]").forEach(el => {
      const moduloElemento = normalizar(el.getAttribute("data-modulo"));

      if(moduloElemento === moduloHoja){
        el.style.display = visible ? "" : "none";
      }
    });
  });

  const seccionActiva = document.querySelector(".section.active");

  if(seccionActiva && seccionActiva.style.display === "none"){
    const primeraVisible = Array.from(document.querySelectorAll(".section"))
      .find(s => s.style.display !== "none");

    if(primeraVisible){
      mostrar(primeraVisible.id);
    }
  }
}