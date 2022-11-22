const ua = navigator.userAgent;
const IE = ua.indexOf("MSIE ") > -1 || ua.indexOf("Trident/") > -1
if (IE) {

  String.prototype.startsWith = function (token) {
    return this.indexOf(token) == 0;
  }

  String.prototype.includes = function (token) {
    return this.indexOf(token) > -1;
  }

  Object.prototype.assign = function (base, obj1, obj2) {
    obj1 = obj1 || {};
    var keys1 = Object.keys(obj1);
    keys1.forEach(function (key) {
      base[key] = obj1[key];
    });

    obj2 = obj2 || {};
    var keys2 = Object.keys(obj2);
    keys2.forEach(function (key) {
      base[key] = obj2[key];
    });

    return base;
  }

  const forEach = function (callback) {
    for (var i = 0; i < this.length; i++) {
      var item = this[i];
      callback(item, i, this);
    }
  }

  Array.prototype.forEach = forEach;
  NodeList.prototype.forEach = forEach;
}

document.addEventListener('DOMContentLoaded', function (e) {
  process(document.body, function () {
    window.setTimeout(function () {
      document.body.classList.add('loaded');
    }, 1);
  });
}, false);

function id() {
  const format = [8, 4, 4, 4, 12];
  let value = '';
  while (format.length) {
    format[0]--;
    value += Math.floor(Math.random() * 16).toString(16);
    if (format[0] === 0) {
      if (format[1]) value += '-';
      format.shift();
    }
  }
  return value;
}

let ctrl = {};

async function getComponent(file) {
  const result = await fetch(`./components/${file}.html`);
  return await result.text();
}

async function process(element, callback) {
  const children = element.children;
  const waiting = children.length;

  const ready = async () => {
    waiting--;
    if (waiting > 0) {
      return;
    } else if (waiting < 0) {
      callback(false);
      return;
    }
    if (element.tagName == 'DIV' && element.attributes['template']) {
      var file = element.attributes['template'].value;
      const contents = await getFile(file);
      // separate the css from the tags (there can only be one)
      var css = '';
      if (contents.startsWith('<link rel=')) {
        var index = contents.indexOf('>');
        css = contents.substr(0, index + 1);
        contents = contents.substr(index + 1);
      }
      var jsSplits = contents.split('<script>');
      var script = '';
      // separate the script from the tags
      if (jsSplits.length > 1) {
        contents = jsSplits[0];
        script = jsSplits[1].split('</script>')[0];
      }
      var myId = id();
      var wroteId = false;
      // replace any attributes with their content
      for (var a = 0; a < element.attributes.length; a++) {
        var attr = element.attributes[a];
        if (attr.name.startsWith('mn-')) {
          if (attr.name == 'mn-id') {
            myId = attr.value;
            wroteId = true;
          }
          var patt = new RegExp('{{' + attr.name.substr(3) + '}}', 'gi');
          contents = contents.replace(patt, attr.value);
          script = script.replace(patt, attr.value);
        }
      }
      // add id
      if (contents.includes("{{id}}")) {
        var patt = new RegExp('{{id}}', 'gi');
        contents = contents.replace(patt, myId);
        script = script.replace(patt, myId);
        wroteId = true;
      }
      if (!wroteId) {
        var index = contents.indexOf('<div'); // find the first/parent div element
        index += contents.substr(index).indexOf('>');
        contents = contents.substr(0, index) + ' id="' + myId + '" ' + contents.substr(index);
        wroteId = true;
      }
      // if there are children, look for the innerHTML tag
      if (element.children.length > 0 || element.innerHTML) {
        var innerHTML = element.innerHTML;
        var patt = new RegExp('{{innerHTML}}', 'gi');
        contents = contents.replace(patt, innerHTML);
      }
      // if there are any leftover tags, delete them
      var removeExtraTags = function (text) {
        var tokens = text.split('{{');
        for (var t = 0; t < tokens.length; t++) {
          var i = tokens[t].indexOf('}}');
          if (i > -1) {
            tokens[t] = tokens[t].substr(i + 2);
          }
        }
        return tokens.join('');
      };
      if (contents.includes('{{')) contents = removeExtraTags(contents);
      if (script.includes('{{')) script = removeExtraTags(script);
      // write the new contents
      var keep = element.attributes['keep'] || element.attributes['route'];
      if (!keep) {
        var classList = element.classList;
        var attributes = element.attributes;
        var oldElement = element;
        element.outerHTML = contents;
        element = document.querySelector('#' + myId);
        for (var i = 0; i < classList.length; i++) {
          element.classList.add(classList[i]);
        }
        // replace any attributes with their content
        for (var a = 0; a < attributes.length; a++) {
          var attr = attributes[a];
          if (attr.name.startsWith('on')) {
            element[attr.name] = oldElement[attr.name];
            continue;
          }
          if (!attr.name.startsWith('mn-')
            && attr.name != 'class'
            && attr.name != 'template') {
            element.attributes[attr.name] = attr;
          }
        }
      } else {
        element.innerHTML = contents;
      }
      // put the css in place (if it's not already loaded)
      var cssOverheadLength = '<link rel="stylesheet" href="'.length;
      var cssOverheadLength2 = '"/>'.length;
      var cssName = css.substr(cssOverheadLength, css.length - (cssOverheadLength + cssOverheadLength2));
      if (document.head.innerHTML.indexOf(cssName) < 0) {
        document.head.innerHTML += css;
      }
      // execute the script to activate it
      if (script) {
        script = '(function() {' + script + '})()';
        ctrl = Object.assign({}, ctrl, eval(script));
      }
      //console.log(elementIdentifier(element), 'done, waiting for element to fully load...');
      window.setTimeout(function () {
        // this handles the case where a template is used inside a template
        if (element.innerHTML.includes('template="')) {
          var myChildren = element.children;
          var myWaiting = myChildren.length;
          for (var c = 0; c < myChildren.length; c++) {
            var child = myChildren[c];
            var childNum = c + 1;
            process(child, function () {
              myWaiting--;
              if (myWaiting == 0) {
                callback(true);
              }
            });
          }
        } else {
          callback(true);
        }
      }, 50);
    } else {
      //console.log(elementIdentifier(element), 'nothing to do, notifying parent');
      callback(false);
    }
  };

  if (children.length > 0) {
    for (var c = 0; c < children.length; c++) {
      var child = children[c];
      var childNum = c + 1;
      process(child, function () {
        ready();
      });
    }
  } else {
    waiting++;
    ready();
  }
