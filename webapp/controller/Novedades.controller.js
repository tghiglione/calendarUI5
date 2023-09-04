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
                var oRouter=UIComponent.getRouterFor(this);
                oRouter.getRoute("RouteNovedades").attachPatternMatched(this._onEmpleadoMatched,this)
            },
           _onEmpleadoMatched:function(oEvent){
                var oArgs=oEvent.getParameter("arguments");
                var oView=this.getView();
                oView.bindElement({
                    path:`/EmpleadosSet('${oArgs.empleadoId}')`,
                    events:{
                        dataRequested: function () {
                            oView.setBusy(true);
                        },
                        dataReceived: function () {
                            oView.setBusy(false);
                        }
                    }
                })
           },
           navToCalendar:function(oEvent){
            var oEmpleado=oEvent.getSource();
            var oRouter= UIComponent.getRouterFor(this);
            var oEmpleadoId=oEmpleado.getBindingContext().getProperty("EMPLEADO_ID");
            oRouter.navTo("RouteCalendar",{
                empleadoId:oEmpleadoId
            })
           }
        });
    });