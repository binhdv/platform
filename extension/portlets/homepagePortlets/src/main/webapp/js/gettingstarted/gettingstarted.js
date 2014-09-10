/*
 * Copyright (C) 2012 eXo Platform SAS.
 *
 * This is free software; you can redistribute it and/or modify it
 * under the terms of the GNU Lesser General Public License as
 * published by the Free Software Foundation; either version 2.1 of
 * the License, or (at your option) any later version.
 *
 * This software is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public
 * License along with this software; if not, write to the Free
 * Software Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA
 * 02110-1301 USA, or see the FSF site: http://www.fsf.org.
 */

(function ($) {
    return {
        initGettingStarted: function() {
            $('.jz').on("click", '#DeleteLink' ,function () {
                $.getJSON('/rest/homepage/intranet/getting-started/deletePortlet/delete');
                $('.GettingStartedContainer').jzLoad("GettingStarted.delete()");
                $('.GettingStartedContainer').css("display","none") ;
            });

            $('.jz').on("click",'.uiIconClose' ,function () {
                $.getJSON('/rest/homepage/intranet/getting-started/deletePortlet/delete');

                $('.GettingStartedContainer').jzLoad("GettingStarted.delete()");

            });

            $.ajax({
                cache: false,
                url: '/rest/homepage/intranet/getting-started/deletePortlet/IsDelete',
                dataType: 'json',
                success: function (del) {
                    if(del == true)        $('.GettingStartedContainer').css("display","none") ;
                    setTimeout(function () {
                        if (del == false) {
                            $('.GettingStarted').jzLoad("GettingStarted.getGsList()", {"reload":"true"});
                        }
                    }, 100);
                    setInterval(function () {
                        $.getJSON('/rest/platform/isusersessionalive', function (connected) {
                            if (del == false && connected == true) {
                                $('.TmpGettingStarted').jzLoad("GettingStarted.getGsList()", {"reload":"false"});
                                var ct = $('.TmpGettingStarted').html();
                                if(ct!="") {
                                    $('.GettingStarted').html(ct);
                                    $('.TmpGettingStarted').html('');
                                }
                            }
                        });
                    }, 60000);
                }
            });
        }
    };
})($);