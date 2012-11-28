winkstart.module('fax_in', 'faxes_in', {
        css: [
            'css/faxes_in.css'
        ],

        templates: {
            faxes_in: 'tmpl/faxes_in.html'
        },

        subscribe: {
            'faxes_in.activate' : 'activate'
        },

        resources: {
            'fax_in_account.get': {
                url: '{api_url}/accounts/{account_id}',
                contentType: 'application/json',
                verb: 'GET'
            },
          
            'user_settings.get': {
                url: '{api_url}/accounts/{account_id}/users/{user_id}',
                contentType: 'application/json',
                verb: 'GET'
            },
            'fax_in.list': {
                url: '{api_url}/accounts/{account_id}/faxes/incoming',
                contentType: 'application/json',
                verb: 'GET'
            }
        }
    },

    function(args) {
        var THIS = this;
		
        winkstart.registerResources(THIS.__whapp, THIS.config.resources);
		
		winkstart.publish('whappnav.subnav.add', {
			whapp: 'fax_in',
			module: this.__module,
			label: 'Полученные факсы',
			icon: 'device', /* Check the icon.css file in whapps/core/layout/css */
			weight: '00'
		});
    },

    {
        get_settings: function(success, error) {
            winkstart.request('user_settings.get', {
                    api_url: winkstart.apps['fax_in'].api_url,
                    account_id: winkstart.apps['fax_in'].account_id,
                    user_id: winkstart.apps['fax_in'].user_id
                },
                function(_data, status) {
                    if(typeof success === 'function') {
                        success(_data);
                    }
                },
                function(_data, status) {
                    if(typeof error === 'function') {
                        error(_data);
                    }
                }
            );
        },

        activate: function(parent) {
            var THIS = this;
		
            THIS.render_faxes_in();
        },

        render_faxes_in: function(parent) {
            var THIS = this,
            parent = parent || $('#ws-content');
						
            THIS.get_settings(function(_data_settings) {
                faxes_html_in = THIS.templates.faxes_in.tmpl(_data_settings);	
		
		$.datepicker.setDefaults(
			$.extend($.datepicker.regional["ru"])
		);
	
		$( "#start_date" , faxes_html_in).datepicker({
            defaultDate: "-7",
            changeMonth: true,
            numberOfMonths: 1,
			dateFormat: "dd M yy",
            onClose: function( selectedDate ) {
                $( "#to" ).datepicker( "option", "minDate", selectedDate );
            }
        });
        $( "#end_date" , faxes_html_in).datepicker({
            defaultDate: "+1",
            changeMonth: true,
            numberOfMonths: 1,
			dateFormat: "dd M yy",
            onClose: function( selectedDate ) {
                $( "#from" ).datepicker( "option", "maxDate", selectedDate );
            }
        });
			
			$( "#start_date" , faxes_html_in).change( function () { list_update(); } )
			$( "#end_date" , faxes_html_in).change( function () { list_update(); } )
			$( "#cancel_date", faxes_html_in).click( function () {
			$( "#start_date" , faxes_html_in).val("");
			$( "#end_date" , faxes_html_in).val("");
			list_update();
			});
			$('#searchLink', faxes_html_in).click(function() {
				winkstart.table.user_fax.fnClearTable();
            });
			
			function list_update() {
				THIS.list_by_date("change",faxes_html_in);
			}
				
                (parent)
                    .empty()
                    .append(faxes_html_in);

                //Hack to display columns properly
                $('.dataTables_scrollHeadInner, .dataTables_scrollHeadInner table', faxes_html_in).attr('style', 'width:100%');
	
		THIS.list_by_date();
            });
        },
		
        list_by_date: function(a, faxes_html_in) {
            var THIS = this;
			if ( a == "change" ) { winkstart.table.user_fax_in.fnClearTable(); }
			start_date1 = $( "#start_date" , faxes_html_in).val();
			end_date1 = $( "#end_date" , faxes_html_in).val();
			if (start_date1 == "") {
			start_date = new Date();
			start_date.setDate(start_date.getDate() - 10);			
			}
			else {
			start_date = new Date(start_date1);
			}
			if (end_date1 == "") {
			end_date = new Date();
			end_date.setDate(end_date.getDate() + 1);			
			}
			else {
			end_date = new Date(end_date1);
			end_date.setDate(end_date.getDate() + 1);
			}
		
            winkstart.request('fax_in.list', {
                    account_id: winkstart.apps['fax_in'].account_id,
                    api_url: winkstart.apps['fax_in'].api_url,
                    user_id: winkstart.apps['fax_in'].user_id //,
                  //  created_from: start_date,
                 //   created_to: end_date
                },
                function(_data, status) {
					var created_time;
                    var tab_data_in = [];
					var tmp = 0;
					var tmp_status = "completed"
                    $.each(_data.data, function() {
                   	   
							created_time = new Date((this.created - 62167219200) * 1000);
							var month = created_time.getMonth()+1 < 10 ? '0'+(created_time.getMonth()+1) : created_time.getMonth()+1;
							var day = created_time.getDate() < 10 ? '0'+created_time.getDate() : created_time.getDate();
							var hour = created_time.getHours()+1 < 10 ? '0'+(created_time.getHours()) : created_time.getHours();
							var minute = created_time.getMinutes() < 10 ? '0'+created_time.getMinutes() : created_time.getMinutes();
							
							if (created_time <= end_date && created_time >= start_date) {
							
							created_time = day + '.' + month + '.'  + created_time.getFullYear() + ' / ' + hour + ':' + minute;
							
							if (this.created > tmp) {
							tmp = this.created;
							tmp_status = this.status;
						   } 
						   
                            tab_data_in.push([
                                created_time,
								this.to,
								this.status   
                            ]);
							}
              
                    });	
									
               var columns = [
                {
                    'sTitle': 'Дата',
                    'sWidth': '250px'
                },

                {
                    'sTitle': 'Набранный номер',
                    'sWidth': '350px'
                },
                {
                    'sTitle': 'Статус',
                    'sWidth': '160px'
                }
            ];
					if (a == "change") {
					winkstart.table.user_fax_in.destroy();
					}
					
					winkstart.table.create('user_fax_in', $('#user_faxes_in-grid', faxes_html_in), columns, {}, {
                sDom: '<"date">frtlip',
                sScrollY: '222px',
                aaSorting: [[0, 'desc']]
            });
	
                   winkstart.table.user_fax_in.fnAddData(tab_data_in);
					
                    $('.dataTables_scrollHeadInner, .dataTables_scrollHeadInner table').attr('style', 'width:100%');
			});
        }
});
		
