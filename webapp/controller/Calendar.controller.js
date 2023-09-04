sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/UIComponent",
    "sap/ui/core/library",
    "sap/ui/core/Fragment",
	"sap/ui/core/format/DateFormat",
	"sap/ui/model/json/JSONModel",
	"sap/ui/unified/library",
    "sap/m/MessageBox",
	"sap/m/MessageToast",
	"sap/ui/core/date/UI5Date",
    "../utils/formatter",
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller,UIComponent,coreLibrary,Fragment, DateFormat, JSONModel, unifiedLibrary,MessageBox,  MessageToast, UI5Date,formatter) {
        "use strict";

        return Controller.extend("novedades.controller.Calendar", {

            formatter:formatter,
            
            onInit: function () {
                this.miId=null
                var oRouter=UIComponent.getRouterFor(this);
                oRouter.getRoute("RouteCalendar").attachPatternMatched(this._onEmpleadoMatched,this); //enrutamiento

                var oModel = new JSONModel(); //modelo de calendario
                oModel.setData({
                        startDate: new Date(),
                        appointments: []
                });

                this.getView().setModel(oModel,"calendario"); //seteo el modelo a la vista

                oModel = new JSONModel();
                oModel.setData({allDay: false});
                this.getView().setModel(oModel, "allDay"); //agrego modelo allDay
            },
            _onEmpleadoMatched:function(oEvent){ //enrutamiento 
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
                this._cargarDatos(oArgs.empleadoId)
           },
            _cargarDatos:function(id){ //cargar las novedades al calendario
                var oDataModel = this.getView().getModel();

                oDataModel.read("/EmpleadosSet('" + id + "')/To_Novedades", {
                    success: function (data) {
                        var appointments = [];
                        data.results.forEach(function(novedad) {
                            var appointment = {
                                title: novedad.NOMBRE_NOVEDAD,
                                text: novedad.MOTIVO,
                                startDate: new Date(novedad.FECHA_NOVEDAD),
                                endDate: new Date(novedad.FECHA_TERMINA_NOV)
                            };
                            appointments.push(appointment);
                        });
                        var oModel = this.getView().getModel("calendario");
                        oModel.setProperty("/appointments", appointments);
                    }.bind(this),
                    error: function (error) {
                        console.error("Error al obtener los datos de las novedades:", error);
                    }
                });
            },
            crearNovedadForm:function(oEvent){ //crear una novedad nueva
                var oData=this.getView().getModel();
                var that=this;
                var empleadoId= oEvent.getSource().getBindingContext().getProperty("EMPLEADO_ID");

                var inputFecha = this.getView().byId("DTPStartDateForm").getValue();
                var inputFechaHasta = this.getView().byId("DTPEndDateForm").getValue(); 
                var inputNombre = this.getView().byId("inputNombreForm").getValue();
                var inputTipo= this.getView().byId("inputTipoForm").getValue();
                var inputMotivo= this.getView().byId("inputMotivoForm").getValue();
                var inputArea= this.getView().byId("inputAreaForm").getValue();

                var newDateDesde = UI5Date.getInstance(inputFecha)
                var newDateHasta = UI5Date.getInstance(inputFechaHasta)
                
                var sPath="/NovedadesSet";

                var newNovedad={
                    "FECHA_NOVEDAD": `${newDateDesde}`,
                    "FECHA_TERMINA_NOV": `${newDateHasta}`,
                    "NOMBRE_NOVEDAD": `${inputNombre}`,
                    "TIPO": `${inputTipo}`,
                    "MOTIVO": `${inputMotivo}`,
                    "EMPLEADO_ID": `${empleadoId}`,
                    "AREA": `${inputArea}`
                }
                
                if(inputFecha!=="" && inputNombre!==""  && inputTipo!=="" && inputMotivo!=="" && inputArea!=="" && inputFechaHasta!==""){
                    MessageBox.confirm(
                        "Desea agregar novedad?",
                        function(oAction){
                            if(MessageBox.Action.OK===oAction){
                                oData.create(sPath, newNovedad, {
                                    success: function () {
                                        MessageToast.show("Novedad agregada con exito")
                                        that.getView().byId("inputNombre").setValue("");
                                        that.getView().byId("inputTipo").setValue("");
                                        that.getView().byId("inputMotivo").setValue("");
                                        that.getView().byId("inputArea").setValue("");
                                    },
                                    error: function (error) {
                                        MessageToast.show("Error agregar novedad")
                                        console.log(error)
                                    }
                                });
                            }
                        },
                        "Agregar Novedad"
                    )
                }else{
                    MessageToast.show("Completar todos los campos")
                }
            },
            crearNovedadCalendar:function(){

            },

        _arrangeDialogFragment: function (sTitle) { //abre el dialogo para editar
            var oView = this.getView();

            if (!this._pNewAppointmentDialog) {
                this._pNewAppointmentDialog = Fragment.load({
                    id: oView.getId(),
                    name: "novedades.view.fragments.CrearCalendario",
                    controller: this
                }).then(function(oModifyDialog){
                    oView.addDependent(oModifyDialog);
                    return oModifyDialog;
                });
            }

            this._pNewAppointmentDialog.then(function(oModifyDialog){
                this._arrangeDialog(sTitle, oModifyDialog);
            }.bind(this));
        },

        _arrangeDialog: function (sTitle, oModifyDialog) {
            this._setValuesToDialogContent();
            oModifyDialog.setTitle(sTitle);
            oModifyDialog.open();
        },

        _setValuesToDialogContent: function () { //setear valores en el edit
            var bAllDayAppointment = (this.byId("allDay")).getSelected(),
                sStartDatePickerID = bAllDayAppointment ? "DPStartDate" : "DTPStartDate",
                sEndDatePickerID = bAllDayAppointment ? "DPEndDate" : "DTPEndDate",
                oStartDateControl = this.byId(sStartDatePickerID),
                oEndDateControl = this.byId(sEndDatePickerID),
                oContext,
                oContextObject,
                oSPCStartDate,
                
                oStartDate,
                oEndDate
    

            if (this.sPath) {
                oContext = this.byId("detailsPopover").getBindingContext();
                oContextObject = oContext.getObject();
                oStartDate = oContextObject.startDate;
                oEndDate = oContextObject.endDate;
                
            } else {
                
                oSPCStartDate = this.getView().byId("calendarioNovedades").getStartDate();
                oStartDate = UI5Date.getInstance(oSPCStartDate);
                oStartDate.setHours(this._getDefaultAppointmentStartHour());
                oEndDate = UI5Date.getInstance(oSPCStartDate);
                oEndDate.setHours(this._getDefaultAppointmentEndHour());
                
            }

           
            oStartDateControl.setDateValue(oStartDate);
            oEndDateControl.setDateValue(oEndDate);
            
        },
        handleAppointmentSelect:function(oEvent){
            var oAppointment = oEvent.getParameter("appointment")
            var oView = this.getView();
            if (!this._pPopover) {
                this._pPopover = Fragment.load({
                    id: oView.getId(),
                    name: "novedades.view.fragments.DetallePopOver",
                    controller: this
                }).then(function(oPopover) {
                    oView.addDependent(oPopover);
                    return oPopover;
                });
            }
            this._pPopover.then(function(oDetailsPopover){
				oDetailsPopover.setBindingContext(oAppointment.getBindingContext());
				oDetailsPopover.openBy(oAppointment);
			});
        },
        
        handleDialogOkButton: function (oEvent) { //crear Novedad
                var oData=this.getView().getModel();
                var that=this;
                var empleadoId= oEvent.getSource().getBindingContext().getProperty("EMPLEADO_ID");

                var inputFecha = this.byId("DTPStartDate").getValue();
                var inputFechaHasta =this.byId("DTPEndDate").getValue(); 
                var inputNombre = this.byId("inputNombre").getValue();
                var inputTipo= this.byId("inputTipo").getValue();
                var inputMotivo= this.byId("inputMotivo").getValue();
                var inputArea= this.byId("inputArea").getValue();

                var newDateDesde = UI5Date.getInstance(inputFecha)
                var newDateHasta = UI5Date.getInstance(inputFechaHasta)
                
                var sPath="/NovedadesSet";

                var newNovedad={
                    "FECHA_NOVEDAD": `${newDateDesde}`,
                    "FECHA_TERMINA_NOV": `${newDateHasta}`,
                    "NOMBRE_NOVEDAD": `${inputNombre}`,
                    "TIPO": `${inputTipo}`,
                    "MOTIVO": `${inputMotivo}`,
                    "EMPLEADO_ID": `${empleadoId}`,
                    "AREA": `${inputArea}`
                }
                console.log(newNovedad)
                if(inputFecha!=="" && inputNombre!==""  && inputTipo!=="" && inputMotivo!=="" && inputArea!=="" && inputFechaHasta!==""){
                    MessageBox.confirm(
                        "Desea agregar novedad?",
                        function(oAction){
                            if(MessageBox.Action.OK===oAction){
                                oData.create(sPath, newNovedad, {
                                    success: function () {
                                        MessageToast.show("Novedad agregada con exito")
                                        sap.ui.getCore().byId(inputNombre).setValue("");
                                        sap.ui.getCore().byId(inputTipo).setValue("");
                                        sap.ui.getCore().byId(inputMotivo).setValue("");
                                        sap.ui.getCore().byId(inputArea).setValue("");
                                    },
                                    error: function (error) {
                                        MessageToast.show("Error agregar novedad")
                                        console.log(error)
                                    }
                                });
                            }
                        },
                        "Agregar Novedad"
                    )
                }else{
                    MessageToast.show("Completar todos los campos")
                }

                this.byId("modifyDialog").close();
            },
        formatDate: function (oDate) { //formateo de fechas para el popover
            if (oDate) {
                var iHours = oDate.getHours(),
                iMinutes = oDate.getMinutes(),
                iSeconds = oDate.getSeconds();

                if (iHours !== 0 || iMinutes !== 0 || iSeconds !== 0) {
                    return DateFormat.getDateTimeInstance({ style: "medium" }).format(oDate);
                } else  {
                    return DateFormat.getDateInstance({ style: "medium" }).format(oDate);
                }
            }
            return "";
        },

        handleDialogCancelButton:  function () { //cerrar popover
            this.sPath = null;
            this.byId("modifyDialog").close();
        },

        handleCheckBoxSelect: function (oEvent) { //checkbox de all day en el crear novedad
            var bSelected = oEvent.getSource().getSelected(),
                sStartDatePickerID = bSelected ? "DTPStartDate" : "DPStartDate",
                sEndDatePickerID = bSelected ? "DTPEndDate" : "DPEndDate",
                oOldStartDate = this.byId(sStartDatePickerID).getDateValue(),
                oNewStartDate = UI5Date.getInstance(oOldStartDate),
                oOldEndDate = this.byId(sEndDatePickerID).getDateValue(),
                oNewEndDate = UI5Date.getInstance(oOldEndDate);

            if (!bSelected) {
                oNewStartDate.setHours(this._getDefaultAppointmentStartHour());
                oNewEndDate.setHours(this._getDefaultAppointmentEndHour());
            } else {
                this._setHoursToZero(oNewStartDate);
                this._setHoursToZero(oNewEndDate);
            }

            sStartDatePickerID = !bSelected ? "DTPStartDate" : "DPStartDate";
            sEndDatePickerID = !bSelected ? "DTPEndDate" : "DPEndDate";
            this.byId(sStartDatePickerID).setDateValue(oNewStartDate);
            this.byId(sEndDatePickerID).setDateValue(oNewEndDate);
        },

        _getDefaultAppointmentStartHour: function() {
            return 9;
        },

        _getDefaultAppointmentEndHour: function() {
            return 10;
        },

        _setHoursToZero: function (oDate) {
            oDate.setHours(0, 0, 0, 0);
        },

        handleAppointmentCreate: function () { //boton crear del calendario
            this._createInitialDialogValues(this.getView().byId("calendarioNovedades").getStartDate());
        },

        handleHeaderDateSelect: function (oEvent) {
            this._createInitialDialogValues(oEvent.getParameter("date"));
        },

        _createInitialDialogValues: function (oDate) {
            var oStartDate = UI5Date.getInstance(oDate),
                oEndDate = UI5Date.getInstance(oStartDate);

            oStartDate.setHours(this._getDefaultAppointmentStartHour());
            oEndDate.setHours(this._getDefaultAppointmentEndHour());
            this.sPath = null;

            this._arrangeDialogFragment("Create appointment");
        },

        updateButtonEnabledState: function (oDateTimePickerStart, oDateTimePickerEnd, oButton) {
            var bEnabled = oDateTimePickerStart.getValueState() !== "Error"
                && oDateTimePickerStart.getValue() !== ""
                && oDateTimePickerEnd.getValue() !== ""
                && oDateTimePickerEnd.getValueState() !== "Error";

            oButton.setEnabled(bEnabled);
        },

        handleDateTimePickerChange: function() { //cambio del time picker
            var oDateTimePickerStart = this.byId("DTPStartDate"),
                oDateTimePickerEnd = this.byId("DTPEndDate"),
                oStartDate = oDateTimePickerStart.getDateValue(),
                oEndDate = oDateTimePickerEnd.getDateValue(),
                bEndDateBiggerThanStartDate = oEndDate.getTime() <= oStartDate.getTime(),
                bErrorState = oStartDate && oEndDate && bEndDateBiggerThanStartDate;

            this._setDateValueState(oDateTimePickerStart, bErrorState);
            this._setDateValueState(oDateTimePickerEnd, bErrorState);
            this.updateButtonEnabledState(oDateTimePickerStart, oDateTimePickerEnd, this.byId("modifyDialog").getBeginButton());
        },

        handleDatePickerChange: function () { //cambio del date picker
            var oDatePickerStart = this.byId("DPStartDate"),
                oDatePickerEnd = this.byId("DPEndDate"),
                oStartDate = oDatePickerStart.getDateValue(),
                oEndDate = oDatePickerEnd.getDateValue(),
                bEndDateBiggerThanStartDate = oEndDate.getTime() < oStartDate.getTime(),
                bErrorState = oStartDate && oEndDate && bEndDateBiggerThanStartDate;

            this._setDateValueState(oDatePickerStart, bErrorState);
            this._setDateValueState(oDatePickerEnd, bErrorState);
            this.updateButtonEnabledState(oDatePickerStart, oDatePickerEnd, this.byId("modifyDialog").getBeginButton());
        },

        _setDateValueState: function(oPicker, bErrorState) { //error en la validacion
            var sValueStateText = "Start date should be before End date";

            if (bErrorState) {
                oPicker.setValueState(ValueState.Error);
                oPicker.setValueStateText(sValueStateText);
            } else {
                oPicker.setValueState(ValueState.None);
            }
        },
        onSwitchChange:function(oEvent){ //cambio de switch
            var estado=oEvent.getSource().getState()
            var calendario=this.getView().byId("calendarioNovedades")
            var formulario=this.getView().byId("formularioNovedades")
            if(estado===true){
                calendario.setVisible(true)
                formulario.setVisible(false)
            }else{
                calendario.setVisible(false)
                formulario.setVisible(true)
            }
        }
    });
});