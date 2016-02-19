(function() {
  var calendar_div;
  var weekly_cal_div;
  var month_view_backup;
  var week_view_backup;

  var current_year;
  var current_month;
  var show_from_hour;
  var show_to_hour;

  var dragging_mouse;
  var booking_start;
  var booking_end;

  var json_bookings;
  var arr_bookingObj;

  function init() {

      calendar_div =  $('div#monthly.calendar');
      today = new Date;
      current_year = today.getFullYear();
      current_month = today.getMonth();

      show_from_hour = 10;
      show_to_hour = 20;

      dragging_mouse = false;
      booking_start = new Object();
      booking_end = new Object();

      json_bookings = $('div#json_bookings').text().trim();

      try {
          arr_bookingObj = JSON.parse(json_bookings);
      } catch (Exception) {
          console.log(Exception);
      }

      week_view_backup = new Array();

      // CUSTOM FUNCTION TO GET DAY NAME
      Date.prototype.getDayName = function() {
          var dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
          return dayNames[this.getDay()];
      }

      // CUSTOM FUNCTION TO GET WEEK OF YEAR
      Date.prototype.getWeek = function() {
          var onejan = new Date(this.getFullYear(),0,1);
          return Math.ceil((((this - onejan) / 86400000) + onejan.getDay()+1)/7);
      }

      // CUSTOM FUNCTION TO GET MONTH NAME
      Date.prototype.getMonthName = function() {
          var monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May',
              'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          return monthNames[this.getMonth()];
      }
  }

  $(document).ready(function(){

      init();

      if($(calendar_div).size() == 0)
          return;

      drawCalendar(current_year, current_month);

      highlightTodaysDate();

      drawBookings('monthly');

      highlightWeekends();

      $('div.week-days').on('click', 'ul.week li:first-child', function(){
          bindWeekNo($(this));
      });

      // DISABLE SELECTION ON DRAG
      $(calendar_div).disableSelection();

      // START DRAGGING
      $('div.week-days').on('mousedown', 'ul.week li ul.hour li', function(){
          $(this).mousemove(function(){

              // CLEAR ANY PREVIOUS 'NEW' SELECTION
              $('ul.hour li.new.booking').attr('class', '');

              dragging_mouse = true;
              booking_start.date = $(this).parent('ul.hour').parent('li').find('p.date').text();
              booking_start.li = $(this).index() + 1;

              $(this).addClass('new booking');
              $(this).unbind('mousemove');
          });
      });

      // DRAGGING
      $('div.week-days').on('mouseover', 'ul.week li ul.hour li', function(){
          if(dragging_mouse) {
              if($(this).hasClass('booking')) {
                  dragging_mouse = false;
                  $('ul.hour li.new.booking').attr('class', '');
                  return;
              }
              else
                  $(this).addClass('new booking');
          }
      });

      // END DRAGGING
      $('div.week-days').on('mouseup', 'ul.week li ul.hour li', function(){
          $(this).unbind('mousemove');
          if(dragging_mouse) {
              dragging_mouse = false;
              booking_end.date = $(this).parent('ul.hour').parent('li').find('p.date').text();
              booking_end.li = $(this).index() + 1;

              $(this).addClass('new booking');
              $(this).unbind('mousemove');

              highlightNewBookingSelection();
          }
      });

      $('body').append('<div class="copyrights">'
          +'<p>Powered by jQalendar<br>'
          +'Copyrights (c) 2012 Magesh Ravi</p>'
          +'</div>');
  });

  function redrawCalendar(new_year, new_month) {

      $(calendar_div).html('');

      month_view_backup = '';
      week_view_backup = new Array();

      drawCalendar(new_year, new_month);

      drawBookings('monthly');

      highlightWeekends();

      $('div.week-days').on('click', 'ul.week li:first-child', function(){
          bindWeekNo($(this));
      });

  }

  function bindWeekNo(li_el) {

      if($(calendar_div).has('div.week-days ul.week li ul.hour').size()) {
          // HIDE PREVIOUS WEEK VIEWS IF ANY
          hideWeeklyCalendar(function(){
              weekly_cal_div = $(li_el).parent('ul.week').parent('div.week-days');
              showWeeklyCalendar();
          });
      } else {
          weekly_cal_div = $(li_el).parent('ul.week').parent('div.week-days');
          showWeeklyCalendar();
      }
  }

  function drawDayNames() {

      $(calendar_div).append(
          '<div class="day-names">'+
              '<ul class="week">'+
                  '<li>Week No</li>'+
                  '<li>Sun</li>'+
                  '<li>Mon</li>'+
                  '<li>Tue</li>'+
                  '<li>Wed</li>'+
                  '<li>Thu</li>'+
                  '<li>Fri</li>'+
                  '<li>Sat</li>'+
              '</ul>'+
              '<div class="clearer"></div>'+
          '</div>'
          );
  }

  function drawCalendar(year, month) {

      current_year = year;
      current_month = month;

      date = new Date(current_year, current_month);

      day_of_week = date.getDay();

      // GET WEEK OF YEAR
      week = date.getWeek();

      // NO. OF DAYS IN MONTH
      days_in_month = new Date(current_year, parseInt(current_month)+1, 0).getDate();

      // TITLE
      $(calendar_div).append(
          '<h1>'+date.getMonthName()+' '+date.getFullYear()+'</h1>'
      );

      drawDayNames();

      cur_date = 1;

      // FIRST WEEK
      first_week = '';

      first_week += '<div id="'+week+'" class="week-days">'+
              '<ul class="week">'+
                  '<li>'+ week +'<br><span>Toggle View</span></li>';

      for(day_no = 1; day_no <= 7; day_no++) {

          if(day_of_week > 0) {
              first_week += '<li><p class="date">&nbsp;</p></li>';
              day_of_week--;
          } else {

              bookingObjKey = current_year+'-'+current_month+'-'+cur_date;

              first_week += '<li><p class="date">'+cur_date+'</p></li>';
              cur_date++;
          }
      }

      first_week += '</ul>'+
              '<div class="clearer"></div>'+
          '</div>';

      $(calendar_div).append(first_week);

      week++;

      //SUBSEQUENT WEEKS
      next_week = '';

      while (cur_date <= days_in_month && (days_in_month-cur_date) >= 7) {

          next_week += '<div id="'+week+'" class="week-days">'+
              '<ul class="week">'+
                  '<li>'+ week +'<br><span>Toggle view</span></li>';

          for(day_no = 1; day_no <= 7; day_no++) {

              if(cur_date <= days_in_month) {
                  next_week += '<li><p class="date">'+cur_date+'</p></li>';
                  cur_date++;
              }
          }

          next_week += '</ul>'+
              '<div class="clearer"></div>'+
          '</div>';

          week++;
      }

      $(calendar_div).append(next_week);

      //LAST WEEK
      last_week = '';

      last_week += '<div id="'+week+'" class="week-days">'+
              '<ul class="week">'+
                  '<li>'+ week +'<br><span>Toggle view</span></li>';

      for(day_no = 1; day_no <= 7; day_no++) {

          if(cur_date <= days_in_month) {
              last_week += '<li><p class="date">'+cur_date+'</p></li>';
              cur_date++;
          } else {
              last_week += '<li><p class="date">&nbsp;</p></li>';
          }
      }

      last_week += '</ul>'+
              '<div class="clearer"></div>'+
          '</div>';

      $(calendar_div).append(last_week);
  }

  function highlightTodaysDate() {
      $(calendar_div).find('div.week-days ul.week li:has(p.date:contains("'+ new Date().getDate() +'"))').css('background-color','#E7FFE3');
  }

  function highlightWeekends() {
      $(calendar_div).find('div.week-days ul.week li:nth-child(2)').addClass('weekend');
      $(calendar_div).find('div.week-days ul.week li:nth-child(8)').addClass('weekend');
  }

  function showWeeklyCalendar() {

      // IF CURRENT DIV IS IN WEEK VIEW
      if($(weekly_cal_div).has('ul.week li ul.hour').size()) {
          hideWeeklyCalendar();
          return;
      }

      //IF CURRENT DIV IS IN BACKUP
      if(week_view_backup[$(weekly_cal_div).attr('id')] != undefined) {

          backupMonthlyView();

          $(weekly_cal_div).slideUp('slow', function() {

              // DIM OUT OTHER WEEKS
              $('div.week-days').css('background-color','#EEE');

              restoreWeeklyView();

              $(weekly_cal_div).css('background-color', 'white');

              // REMOVE LIMIT ON HEIGHT
              $(weekly_cal_div).css('height','auto');
          });

          $(weekly_cal_div).slideDown('slow');

          return;
      }

      ul_week = '<ul class="hour">';

      i = 0;
      for(hour = show_from_hour; hour < show_to_hour; hour=hour+0.25) {
          if(i == 0)
              ul_week += '<li>'+hour+'</li>';
          else
              ul_week += '<li></li>';

          if(i == 3)
              i=0;
          else
              i++;
      }

      ul_week += '</ul>';

      $(weekly_cal_div).slideUp('slow', function() {

          // DIM OUT OTHER WEEKS
          $('div.week-days').css('background-color','#EEE');

          backupMonthlyView();

          // REMOVE LIMIT ON HEIGHT
          $(weekly_cal_div).css('height','auto');

          $(weekly_cal_div).find('ul.week li:not(:first-child)').each(function(){

              //REMOVE BOOKINGS IN MONTHLY VIEW
              $(this).find('p.booking').remove();

              // DAY NAME AND DATE
              $(this).find('p.date').each(function(){

                  date_text = $(this).text().trim();

                  if(date_text != '') {
                      temp_date = new Date(current_year, current_month, date_text);
                      $(this).text( temp_date.getDayName()+' - '+$(this).text()+' '+temp_date.getMonthName());
                  }

                  $(this).css(
                      {'text-align':'center', 'background-color':'darkgray', 'color':'white'}
                  );
              });

              $(this).append(ul_week);

              $(this).parent('ul.week').parent('.week-days').css('background-color', 'white');
          });

          //console.log('showing weekly view div #'+$(weekly_cal_div).attr('id'));

          $(weekly_cal_div).slideDown('slow', function() {
              drawBookings('weekly');
          });
      });
  }

  function hideWeeklyCalendar(callback) {

      $(weekly_cal_div).slideUp('slow', function(){

          // SET LIMIT ON HEIGHT
          $(weekly_cal_div).css('height','86px');

          // LIGHTUP OTHER WEEKS
          $('div.week-days').css('background-color','white');

          restoreMonthlyView();

          $(weekly_cal_div).slideDown('slow');

          if(callback !== undefined)
              callback();
      });
  }

  function drawBookings(view) {

      if(arr_bookingObj == undefined)
          return;

      console.log('VIEW: '+view);

      if(view == 'weekly') {

          for(i=0; i<arr_bookingObj.length; i++) {

              bookingObj = arr_bookingObj[i];
              from_datetime = bookingObj['From'];
              to_datetime = bookingObj['To'];
              title = bookingObj['Title'];
              desc = bookingObj['Desc'];

              //console.log('FROM: '+from_datetime);
              //console.log('TO: '+to_datetime);

              from_date_ymd = from_datetime.substring(0, 10);
              from_year = from_datetime.substring(0,4);
              from_month = parseInt(from_datetime.substring(5,7)) - 1;
              from_date = from_date_ymd.substring(8);
              from_time = from_datetime.substring(11,16);

              if(from_year != current_year)
                  continue;

              if(from_month != current_month)
                  continue;

              to_date_ymd = to_datetime.substring(0, 10);
              to_year = to_datetime.substring(0,4);
              to_month = parseInt(to_datetime.substring(5,7)) - 1;
              to_date = to_date_ymd.substring(8);
              to_time = to_datetime.substring(11,16);

              if(to_year != current_year)
                  continue;

              if(to_month != current_month)
                  continue;

              if(from_date == to_date) {

                  //console.log('STARTS AND ENDS ON SAME DAY');

                  from_time_hr = from_time.substring(0,2);
                  from_time_min = from_time.substring(3,5);

                  to_time_hr = to_time.substring(0,2);
                  to_time_min = to_time.substring(3,5);

                  if(from_time_hr < show_from_hour)
                      continue;

                  if(to_time_hr < show_from_hour)
                      continue;

                  from_time_diff_from_start_hour = (from_time_hr - show_from_hour) + Math.round((from_time_min/60)*100)/100;
                  starting_cell = Math.ceil(from_time_diff_from_start_hour*4)+1;

                  to_time_diff_from_start_hour = (to_time_hr - show_from_hour) + Math.round((to_time_min/60)*100)/100;
                  ending_cell = Math.ceil(to_time_diff_from_start_hour*4);

                  if(starting_cell < 0)
                      continue;

                  if(ending_cell < 0)
                      continue;

                  tar_ul_hour = $(calendar_div)
                      .find('ul.week li')
                          .has('p.date:contains("'+from_date+'")')
                      .find('ul.hour');

                  // STARTING TIME
                  $(tar_ul_hour)
                      .find('li:nth-child('+starting_cell+')')
                      .text(from_time).addClass('start time');

                  // SHOW TITLE
                  $(tar_ul_hour)
                      .find('li:nth-child('+ (starting_cell+1) +')')
                      .text(title).addClass('time');

                  // ENDING TIME
                  $(calendar_div)
                      .find('ul.week li')
                          .has('p.date:contains("'+to_date+'")')
                      .find('ul.hour li:nth-child('+ending_cell+')')
                      .text(to_time).addClass('end time');

                  // ADD STYLING TO IN-BETWEEN RANGE
                  $(calendar_div)
                      .find('ul.week li')
                          .has('p.date:contains("'+from_date+'")')
                      .find('ul.hour li:nth-child(n+'+starting_cell+'):nth-child(-n+'+ending_cell+')')
                      .addClass('booking');

              } else if(to_date > from_date) {

                  //console.log('STARTS AND ENDS ON DIFFERENT DAYS');

                  from_time_hr = from_time.substring(0,2);
                  from_time_min = from_time.substring(3,5);

                  to_time_hr = to_time.substring(0,2);
                  to_time_min = to_time.substring(3,5);

                  if(from_time_hr < show_from_hour)
                      continue;

                  if(to_time_hr < show_from_hour)
                      continue;

                  from_time_diff_from_start_hour = (from_time_hr - show_from_hour) + Math.round((from_time_min/60)*100)/100;
                  starting_cell = Math.ceil(from_time_diff_from_start_hour*4)+1;
                  last_cell = (show_to_hour-show_from_hour)*4;

                  to_time_diff_from_start_hour = (to_time_hr - show_from_hour) + Math.round((to_time_min/60)*100)/100;
                  ending_cell = Math.ceil(to_time_diff_from_start_hour*4);

                  //console.log('STARTING DAY STARTING CELL: '+starting_cell);
                  //console.log('STARTING DAY ENDING CELL: '+last_cell);
                  //console.log('ENDING DAY ENDING CELL: '+ending_cell);

                  if(starting_cell < 0)
                      continue;

                  if(ending_cell < 0)
                      continue;

                  tar_ul_hour_from = $(weekly_cal_div)
                      .find('ul.week li')
                          .has('p.date:contains("'+from_date+'")')
                      .find('ul.hour');

                  // CURRENT BOOKING STARTS IN CURRENT WEEK
                  if($(tar_ul_hour_from).size() > 0) {

                      // STARTING DAY - STARTING TIME
                      $(tar_ul_hour_from)
                          .find('li:nth-child('+starting_cell+')')
                          .text(from_time)
                          .addClass('start time');

                      // SHOW TITLE
                      $(tar_ul_hour_from)
                          .find('li:nth-child('+ (starting_cell+1) +')')
                          .text(title).addClass('time');

                      // STARTING DAY - ENDING TIME
                      $(tar_ul_hour_from)
                          .find('li:nth-child('+last_cell+')')
                          .append(' &rarr;');

                      // ADD STYLING TO IN-BETWEEN RANGE
                      $(tar_ul_hour_from)
                          .find('li:nth-child(n+'+starting_cell+'):nth-child(-n+'+last_cell+')')
                          .addClass('booking');
                  }

                  // IN-BETWEEN DATES
                  for(ibwDate = parseInt(from_date)+1; ibwDate < to_date; ibwDate++) {

                      //console.log('IN-BETWEEN DATE: '+ibwDate);

                      tar_ul_hour_ibw = $(weekly_cal_div)
                          .find('ul.week li')
                              .has('p.date:contains("'+ibwDate+'")')
                          .find('ul.hour');

                          console.log($(tar_ul_hour_ibw).size());

                      $(tar_ul_hour_ibw)
                          .find('li:nth-child(1)')
                          .prepend('&rarr; ');

                      // ENDING TIME
                      $(tar_ul_hour_ibw)
                          .find('li:nth-child('+last_cell+')')
                          .append(' &rarr;');

                      // ADD STYLING TO IN-BETWEEN RANGE
                      $(tar_ul_hour_ibw)
                          .find('li:nth-child(n+1):nth-child(-n+'+last_cell+')')
                          .addClass('booking');

                  }

                  // CURRENT BOOKING ENDS IN CURRENT WEEK
                  tar_ul_hour_to = $(weekly_cal_div)
                      .find('ul.week li')
                          .has('p.date:contains("'+to_date+'")')
                      .find('ul.hour');

                  if($(tar_ul_hour_to).size() > 0) {

                      // ENDING DAY - START TIME
                      $(tar_ul_hour_to)
                          .find('li:nth-child(1)').prepend('&rarr; ');

                      // STARTING DAY - ENDING TIME
                      $(tar_ul_hour_to)
                          .find('li:nth-child('+ending_cell+')')
                          .text(to_time)
                          .addClass('end time');

                      // ADD STYLING TO IN-BETWEEN RANGE
                      $(tar_ul_hour_to)
                          .find('li:nth-child(n+1):nth-child(-n+'+ending_cell+')')
                          .addClass('booking');
                  }
              }
          }

          backupWeeklyView();

      } else if (view == 'monthly') {

          for(i=0; i<arr_bookingObj.length; i++) {

              bookingObj = arr_bookingObj[i];
              from_datetime = bookingObj['From'];
              to_datetime = bookingObj['To'];
              title = bookingObj['Title'];
              desc = bookingObj['Desc'];

              //console.log('FROM: '+from_datetime);
              //console.log('TO: '+to_datetime);

              from_date_ymd = from_datetime.substring(0, 10);
              from_year = from_datetime.substring(0,4);
              from_month = parseInt(from_datetime.substring(5,7)) - 1;
              from_date = from_date_ymd.substring(8);
              from_time = from_datetime.substring(11,16);

              if(from_year != current_year)
                  continue;

              if(from_month != current_month)
                  continue;

              to_date_ymd = to_datetime.substring(0, 10);
              to_year = to_datetime.substring(0,4);
              to_month = parseInt(to_datetime.substring(5,7)) - 1;
              to_date = to_date_ymd.substring(8);
              to_time = to_datetime.substring(11,16);

              if(to_year != current_year)
                  continue;

              if(to_month != current_month)
                  continue;

              if(from_date == to_date) {

                  //console.log('STARTS AND ENDS ON SAME DAY');

                  from_time_hr = from_time.substring(0,2);
                  from_time_min = from_time.substring(3,5);

                  to_time_hr = to_time.substring(0,2);
                  to_time_min = to_time.substring(3,5);

                  if(from_time_hr < show_from_hour)
                      continue;

                  if(to_time_hr < show_from_hour)
                      continue;

                  $(calendar_div)
                      .find('ul.week li')
                          .has('p.date:contains("'+from_date+'")')
                      .append(
                          '<p class="booking" title="'+title+'">'
                              +from_time_hr+':'+from_time_min
                              +' &rarr; '
                              +to_time_hr+':'+to_time_min
                          +'</p>'
                      );

              } else if(to_date > from_date) {

                  //console.log('STARTS AND ENDS ON DIFFERENT DAYS');

                  from_time_hr = from_time.substring(0,2);
                  from_time_min = from_time.substring(3,5);

                  to_time_hr = to_time.substring(0,2);
                  to_time_min = to_time.substring(3,5);

                  if(from_time_hr < show_from_hour)
                      continue;

                  if(to_time_hr < show_from_hour)
                      continue;

                  $(calendar_div)
                      .find('ul.week li')
                          .has('p.date:contains("'+from_date+'")')
                      .append(
                          '<p class="booking" title="'+title+'">'
                              +from_time_hr+':'+from_time_min
                              +' &rarr; '
                          +'</p>'
                      );

                  // IN-BETWEEN DATES
                  for(ibwDate = parseInt(from_date)+1; ibwDate < to_date; ibwDate++) {

                      //console.log('IN-BETWEEN DATE: '+ibwDate);

                      $(calendar_div)
                      .find('ul.week li')
                          .has('p.date:contains("'+ibwDate+'")')
                      .append(
                          '<p class="booking" title="'+title+'">'
                              +' &rarr; '
                          +'</p>'
                      );

                  }

                  $(calendar_div)
                      .find('ul.week li')
                          .has('p.date:contains("'+to_date+'")')
                      .append(
                          '<p class="booking" title="'+title+'">'
                              +' &rarr; '
                              +to_time_hr+':'+to_time_min
                          +'</p>'
                      );
              }
          }

      }
  }

  function backupWeeklyView() {
      console.log('backup weekly view...');
      week_view_backup[$(weekly_cal_div).attr('id')] = $(weekly_cal_div).html();
  }

  function backupMonthlyView() {
      console.log('backup monthly view...');
      month_view_backup = $(weekly_cal_div).html();
  }

  function restoreWeeklyView() {
      console.log('restoring weekly view...');
      $(weekly_cal_div).html(week_view_backup[$(weekly_cal_div).attr('id')]);
  }

  function restoreMonthlyView() {
      console.log('restoring monthly view...');
      $(weekly_cal_div).html(month_view_backup);
  }

  function highlightNewBookingSelection() {
      // STARTING AND ENDING ON SAME DAY
      if(booking_start.date == booking_end.date) {

          starting_child = -1;
          ending_child = -1;

          // DRAGGED FROM TOP TO BOTTOM
          if(booking_start.li < booking_end.li) {
              starting_child = booking_start.li;
              ending_child = booking_end.li;
          }

          //DRAGGED FROM BOTTOM TO TOP
          if(booking_start.li > booking_end.li) {
              starting_child = booking_end.li;
              ending_child = booking_start.li;
          }

          starting_ul = $(calendar_div).find('div.week-days ul.week li:has(p.date:contains('
                  +booking_start.date+')) ul.hour');

          starting_li = $(starting_ul).find('li:nth-child('+starting_child+')');

          ending_ul = $(calendar_div).find('div.week-days ul.week li:has(p.date:contains('
                  +booking_end.date+')) ul.hour');

          ending_li = $(calendar_div)
              .find('div.week-days ul.week li:has(p.date:contains('
                  +booking_start.date+')) ul.hour li:nth-child('+ending_child+')');

          // STARTING TIME
          $(starting_li).addClass('start time').text( show_from_hour+((starting_child-1)/4) );

          // IN-BETWEEN HOURS
          $(calendar_div)
              .find('div.week-days ul.week li:has(p.date:contains('
                  +booking_start.date+')) ul.hour li:nth-child(n+'+starting_child
                  +'):nth-child(-n+'+ending_child+')')
              .addClass('new booking');

          // ENDING TIME
          $(ending_li).addClass('end time');
      }
  }
})();


/* FUNCTION TO TURN OFF console.log()

console.log = function() {}

*/
