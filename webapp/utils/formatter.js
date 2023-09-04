sap.ui.define([], function () {
    "use strict";
    return {

        fechaFormat:function(sFecha){
            var newDate = sap.ui.core.UI5Date.getInstance(sFecha)
            return newDate;
        }
    
    };
});