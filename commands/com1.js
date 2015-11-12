// Copyright 2013 Clark DuVall
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

var COMMANDS = COMMANDS || {};

COMMANDS.cat =  function(argv, cb) {
   var filenames = this._terminal.parseArgs(argv).filenames,
       stdout;

   this._terminal.scroll();
   if (!filenames.length) {
      this._terminal.returnHandler = function() {
         stdout = this.stdout();
         if (!stdout)
            return;
         stdout.innerHTML += '<br>' + stdout.innerHTML + '<br>';
         this.scroll();
         this.newStdout();
      }.bind(this._terminal);
      return;
   }
   filenames.forEach(function(filename, i) {
      var entry = this._terminal.getEntry(filename);

      if (!entry)
         this._terminal.write('cat: ' + filename + ': No such file or directory');
      else if (entry.type === 'dir')
         this._terminal.write('cat: ' + filename + ': Is a directory.');
      else
         this._terminal.write(entry.contents);
      if (i !== filenames.length - 1)
         this._terminal.write('<br>');
   }, this);
   cb();
}

COMMANDS.cd = function(argv, cb) {
   var filename = this._terminal.parseArgs(argv).filenames[0],
       entry;

   if (!filename)
      filename = '~';
   entry = this._terminal.getEntry(filename);
   if (!entry)
      this._terminal.write('cd: ' + filename + ': No such file or directory');
   else if (entry.type !== 'dir')
      this._terminal.write('cd: ' + filename + ': Not a directory.');
   else
      this._terminal.cwd = entry;
   cb();
}

COMMANDS.ls = function(argv, cb) {
   var result = this._terminal.parseArgs(argv),
       args = result.args,
       filename = result.filenames[0],
       entry = filename ? this._terminal.getEntry(filename) : this._terminal.cwd,
       maxLen = 0,
       writeEntry;

   writeEntry = function(e, str) {
      this.writeLink(e, str);
      if (args.indexOf('l') > -1) {
         if ('description' in e)
            this.write(' - ' + e.description);
         this.write('<br>');
      } else {
         // Make all entries the same width like real ls. End with a normal
         // space so the line breaks only after entries.
         this.write(Array(maxLen - e.name.length + 2).join('&nbsp') + ' ');
      }
   }.bind(this._terminal);

   if (!entry)
      this._terminal.write('ls: cannot access ' + filename + ': No such file or directory');
   else if (entry.type === 'dir') {
      var dirStr = this._terminal.dirString(entry);
      maxLen = entry.contents.reduce(function(prev, cur) {
         return Math.max(prev, cur.name.length);
      }, 0);

      for (var i in entry.contents) {
         var e = entry.contents[i];
         if (args.indexOf('a') > -1 || e.name[0] !== '.')
            writeEntry(e, dirStr + '/' + e.name);
      }
   } else {
      maxLen = entry.name.length;
      writeEntry(entry, filename);
   }
   cb();
}

COMMANDS.gimp = function(argv, cb) {
   var filename = this._terminal.parseArgs(argv).filenames[0],
       entry,
       imgs;

   if (!filename) {
      this._terminal.write('gimp: please specify an image file.');
      cb();
      return;
   }

   entry = this._terminal.getEntry(filename);
   if (!entry || entry.type !== 'img') {
      this._terminal.write('gimp: file ' + filename + ' is not an image file.');
   } else {
      this._terminal.write('<img src="' + entry.contents + '"/>');
      imgs = this._terminal.div.getElementsByTagName('img');
      imgs[imgs.length - 1].onload = function() {
         this.scroll();
      }.bind(this._terminal);
      if ('caption' in entry)
         this._terminal.write('<br/>' + entry.caption);
   }
   cb();
}

COMMANDS.clear = function(argv, cb) {
   this._terminal.div.innerHTML = '';
   cb();
}

COMMANDS.sudo = function(argv, cb) {
   var count = 0;
   this._terminal.returnHandler = function() {
      if (++count < 3) {
         this.write('<br/>Sorry, try again.<br/>');
         this.write('[sudo] password for ' + this.config.username + ': ');
         this.scroll();
      } else {
         this.write('<br/>sudo: 3 incorrect password attempts');
         cb();
      }
   }.bind(this._terminal);
   this._terminal.write('[sudo] password for ' + this._terminal.config.username + ': ');
   this._terminal.scroll();
}

COMMANDS.login = function(argv, cb) {
   this._terminal.returnHandler = function() {
      var username = this.stdout().innerHTML;

      this.scroll();
      if (username)
         this.config.username = username;
      this.write('<br>Password: ');
      this.scroll();
      this.returnHandler = function() { cb(); }
   }.bind(this._terminal);
   this._terminal.write('Username: ');
   this._terminal.newStdout();
   this._terminal.scroll();
}

COMMANDS.tree = function(argv, cb) {
   var term = this._terminal,
       home;

   function writeTree(dir, level) {
      dir.contents.forEach(function(entry) {
         var str = '';

         if (entry.name.startswith('.'))
            return;
         for (var i = 0; i < level; i++)
            str += '|  ';
         str += '|&mdash;&mdash;';
         term.write(str);
         term.writeLink(entry, term.dirString(dir) + '/' + entry.name);
         term.write('<br>');
         if (entry.type === 'dir')
            writeTree(entry, level + 1);
      });
   };
   home = this._terminal.getEntry('~');
   this._terminal.writeLink(home, '~');
   this._terminal.write('<br>');
   writeTree(home, 0);
   cb();
}

COMMANDS.help = function(argv, cb) {
   this._terminal.write(
       'You can navigate either by clicking on anything that ' +
       '<a href="javascript:void(0)">underlines</a> when you put your mouse ' +
       'over it, or by typing commands in the terminal. Type the name of a ' +
       '<span class="exec">link</span> to view it. Use "cd" to change into a ' +
       '<span class="dir">directory</span>, or use "ls" to list the contents ' +
       'of that directory. The contents of a <span class="text">file</span> ' +
       'can be viewed using "cat". <span class="img">Images</span> are ' +
       'displayed using "gimp".<br><br>If there is a command you want to get ' +
       'out of, press Ctrl+C or Ctrl+D.<br><br>');
   this._terminal.write('Commands are:<br>');
   for (var c in this._terminal.commands) {
      if (this._terminal.commands.hasOwnProperty(c) && !c.startswith('_'))
         this._terminal.write(c + '  ');
   }
   cb();
}


COMMANDS.whoami = function(argv, cb) {
   this._terminal.write(this._terminal.config.username);
   cb();
}

COMMANDS.pwd = function(argv, cb) {
   this._terminal.write(this._terminal.getCWD());
   cb();
}

COMMANDS.fortune = function(argv, cb) {
   var database = [
       "A career is great, but you can't run your fingers through its hair.",
       "Always there remain portions of our heart into which no one is able to enter, invite them as we may.",
       "Lonely is a man without love.<br>        -- Englebert Humperdinck",
       "Fat people of the world unite, we've got nothing to lose!",
       "I don't care where I sit as long as I get fed.<br>        -- Calvin Trillin",
       "Waiter: \"Tea or coffee, gentlemen?\"<br>1st customer: \"I'll have tea.\"<br>2nd customer: \"Me, too -- and be sure the glass is clean!\"<br>        (Waiter exits, returns)<br>Waiter: \"Two teas.  Which one asked for the clean glass?\"",
       "Between grand theft and a legal fee, there only stands a law degree.",
       "Why does New Jersey have more toxic waste dumps and California have more lawyers?<br><br>New Jersey had first choice.",
       "A 'full' life in my experience is usually full only of other people's demands.",
       "A city is a large community where people are lonesome together<br>        -- Herbert Prochnow",
       "A real person has two reasons for doing anything ... a good reason and the real reason.",
       "After living in New York, you trust nobody, but you believe everything. Just in case.",
       "All men have the right to wait in line.",
       "People respond to people who respond.",
       "A boy gets to be a man when a man is needed.<br>        -- John Steinbeck",
       "A beautiful man is paradise for the eyes, hell for the soul, and purgatory for the purse.",
       "How beautiful are thy feet with shoes, O prince's daughter! the joints of thy thighs are like jewels, the work of the hands of a cunning workman.  Thy navel is like a round goblet, which wanteth not liquor:  thy belly is like an heap of wheat set about with lillies. Thy two breasts are like two young roses that are twins.<br>[Song of Solomon 7:1-3 (KJV)]",
       "!07/11 PDP a ni deppart m'I  !pleH",
       "1: No code table for op: ++post",
       "A LISP programmer knows the value of everything, but the cost of nothing.<br>        -- Alan Perlis",
       "Remember: use logout to logout.",
       "Except for 75% of the women, everyone in the whole world wants to have sex.<br>        -- Ellyn Mustard",
       "FORTUNE DISCUSSES THE OBSCURE FILMS: #3<br><br>MIRACLE ON 42ND STREET:<br>    Santa Claus, in the off season, follows his heart's desire and tries to make it big on Broadway.<br>    Santa sings and dances his way into your heart.",
       "(1) Everything depends.<br>(2) Nothing is always.<br>(3) Everything is sometimes.",
       "A friend in need is a pest indeed.",
       "(1) Avoid fried meats which angry up the blood.<br>(2) If your stomach antagonizes you, pacify it with cool thoughts.<br>(3) Keep the juices flowing by jangling around gently as you move.<br>(4) Go very lightly on the vices, such as carrying on in society, as the social ramble ain't restful.<br>(5) Avoid running at all times.<br>(6) Don't look back, something might be gaining on you.<br>        -- S. Paige, c. 1951",
       "All is fear in love and war.",
       "Death is Nature's way of recycling human beings.",
       "Death is only a state of mind."
   ];

   var rand = parseInt(Math.random() * database.length);
   this._terminal.write(database[rand]);
   cb();
}

COMMANDS.date = function(argv, cb) {
   this._terminal.write(new Date().toUTCString());
   cb();
}

COMMANDS.cal = function(argv, cb) {
   var month, year, localtime = new Date();
   switch(argv.length) {
    case 2:
        month = parseInt(argv[0]) - 1;
        if (month < 1 || 12 < month) {
            this._terminal.write('cal: illegal month value: use 1-12');
            cb();
            return;
        }
        year = parseInt(argv[1]);
        if (year < 1 || 9999 < year) {
            this._terminal.write('cal: illegal year value: use 1-9999');
            cb();
            return;
        }
        break;
    case 0:
        month = localtime.getMonth();
        year = localtime.getFullYear();
        break;
    default:
        this._terminal.write('cal: usage: cal [month year]');
        cb();
        return;
   }

   var amonth = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
   ], aday = [
        '',
        ' 1', ' 2', ' 3', ' 4', ' 5', ' 6', ' 7',
        ' 8', ' 9', '10', '11', '12', '13', '14',
        '15', '16', '17', '18', '19', '20', '21',
        '22', '23', '24', '25', '26', '27', '28',
        '29', '30', '31'
   ];

   if (month == localtime.getMonth() && year == localtime.getFullYear()) {
       aday[localtime.getDate()] = '<span class="exec">' + aday[localtime.getDate()] + '</span>';
   }

   var table = [],
        weekday = new Date(year, month, 1).getDay(),
        days = new Date(year, month + 1, 0).getDate();
   while (weekday--) {
       table.push('  ');
   }
   for (var i = 1; i <= days; i++) {
       table.push(aday[i]);
   }
   // September 1752 is a special
   if (month == 8 && year == 1752) {
       table = [
           '  ', '  ', '01', '02', '14', '15', '16',
           '17', '18', '19', '20', '21', '22', '23',
           '24', '25', '26', '27', '28', '29', '30'
       ];
   }

   var header = amonth[month] + ' ' + year,
        padding = parseInt((20 - header.length) / 2);
   while (padding--) {
       this._terminal.write(' ');
   }
   this._terminal.write(header + '<br>');
   this._terminal.write('Su Mo Tu We Th Fr Sa<br>');
   var len = table.length, tables = [], i = 0;
   while (i < len) {
       tables.push(table.slice(i, i += 7));
   }
   tables.forEach(function (line) {
       this._terminal.write(line.join(' ') + '<br>');
   }, this);
   this._terminal.write('<br>');
   cb();
}
