sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/UIComponent"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller,UIComponent) {
        "use strict";

        return Controller.extend("novedades.controller.Empleados", {
            onInit: function () {

            },
            onEmpleadoPress:function(oEvent){
                var oEmpleado=oEvent.getSource();
                var oRouter= UIComponent.getRouterFor(this);
                var oEmpleadoId=oEmpleado.getBindingContext().getProperty("EMPLEADO_ID");
                oRouter.navTo("RouteNovedades",{
                    empleadoId:oEmpleadoId
                })
            }
        });
    });
