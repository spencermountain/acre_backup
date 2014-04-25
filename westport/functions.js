var debug = 0;

//////////////////////////
/////////////////////////////


////////
//acre.write(notable_types('/en/radiohead'));
function notable_types(id) {
  var type = '';
  try {
    var url = 'http://www.freebase.com/api/trans/notable_types' + id;
    type = JSON.parse(acre.urlfetch(url).body)[0].t || '';
  } catch (e) {}
  return type;
}

function emptyit() {
  var result = {};
  result.answerid = [];
  result.answer = [];
  result.image = [];
  result.about = [];
  result.wiki = [];
  return result;
}
///////////////////


//acre.write(JSON.stringify(search("toronto")));
function search(text) {
  if (text.match(/[a-z]/)) {
    var result = emptyit();

    var response = get_topic(text);
    try {
      if (response[0].id != null && response[0].id != '') {

        for (var i in response) {
          result.answer[i] = response[i].name;
          result.answerid[i] = response[i].id;
          try {
            result.image[i] = response[i].image.id;
          } catch (e) {
            result.image[i] = '';
          }
          try {
            result.about[i] = notable_types(result.answerid[i]);
          } catch (e) {
            result.about[i] = '';
          }
        }
        done = 1;
        method = 'search';

        var explanation = 'searched for ' + text;
        return {
          subject: '',
          property: '',
          image: '',
          explanation: explanation,
          did: text,
          method: method,
          result: result
        };
      } //if
    } catch (e) {}
  }
  return {
    subject: '',
    property: '',
    image: '',
    explanation: '',
    did: '',
    method: '',
    result: ''
  };
}


//////////////////////////////////////

//acre.write(JSON.stringify(parsequery("bill clinton kids")));
function parsequery(text) {

  var property = '';
  var topic = '';
  var image = '';
  var done = 0;

  //no clues, so try all combinations
  if (done == 0) { //
    var the = parsewords(text);
    var topic = the.topic || '';
    var property = the.property || '';
    var image = the.image || '';
    if (property != '') {
      done = 1;
    }
  }



  return {
    topic: topic,
    property: property,
    image: image
  };

}


////////////////////////


//acre.write(JSON.stringify(get_topic('picaso')));
function get_topic(topic_string) {
  var result = {
    alternatives: []
  };
  // acre.write(topic_string);
  if (topic_string.match(/[a-z]/)) {
    topic_string = topic_string.replace(/^the /, '');
    var search_url = 'http://www.freebase.com/api/service/search?type=/common/topic&type_strict=all&query=' + encodeURI(topic_string);
    result.alternatives = JSON.parse(acre.urlfetch(search_url).body).result;
    var goods = [];
    var g = '';
    try {
      var topscore = result.alternatives[0]["relevance:score"] + 0;
      for (var i in result.alternatives) {
        var score = result.alternatives[i]["relevance:score"] + 0;
        if (i > 5 || topscore - score > 30) {
          result.alternatives = result.alternatives.slice(0, i);
          break;
        } //cut off wrongs
      }
    } catch (e) {}
  }
  return result.alternatives;
}
//////////////////////


////////////////////

function get_any(string, type) {
  var theresult = {
    alternatives: []
  };
  var search_url = 'http://www.freebase.com/api/service/search?type=' + type + '&typestrict=all&query=' + encodeURI(string);
  theresult.alternatives = JSON.parse(acre.urlfetch(search_url).body).result;
  return theresult.alternatives;
}
//////////////

///////////////////////////////////
function trim(strText) {
  if (strText != '') {
    // this will get rid of leading spaces
    while (strText.substring(0, 1) == ' ')
      strText = strText.substring(1, strText.length);

    // this will get rid of trailing spaces
    while (strText.substring(strText.length - 1, strText.length) == ' ')
      strText = strText.substring(0, strText.length - 1);
  }
  return strText;
}


/////////////////////////////////



//acre.write(singularize('skateboarders'));
function singularize(text) {
  var noun = acre.require("engine_noun");

  var r = noun.singularize(text);
  if (r == null) {
    return text;
  } else {
    return r;
  }
}



/////////////////


//acre.write(getcvt("/guid/9202a8c04000641f800000000b16e25d"));
function getcvt(answerid) {
  var answer = [];
  //get properties
  try {
    var query = [{
      "id": answerid,
      "type": [{
        "id": null,
        "properties": [{
          "id": null,
          "name": null
        }]
      }]
    }]
    var the = acre.freebase.mqlread(query).result;
    // var type=the[0].type[0].id;
    var properties = the[0].type[0].properties;
    //acre.write(properties[0].id);
  } catch (e) {
    acre.write(e);
  }
  //http://www.freebase.com/experimental/topic/standard?id=/guid/9202a8c04000641f80000000039dd359
  //  answer[0]+=functions.getcvt(answerid[i]);

  try {
    var url = 'http://www.freebase.com/experimental/topic/standard?id=' + encodeURI(answerid);
    var result = acre.urlfetch(url).body;
    results = JSON.parse(result);
    answer = '';
    for (var o in properties) {
      try {
        var data = results[answerid].result.properties[properties[o].id].values[0].text || '';
        if (data !== '') {
          answer += ', ' + properties[o].name + ': ' + data;
        }
      } catch (e) {} //acre.write(e);
    }
    answer = answer.replace(/^,/, '');
  } catch (e) {
    acre.write('cvt error ' + e);
  }
  return answer;
}


///////////


//acre.write(JSON.stringify(parseofquery('universities of toronto')));
function parseofquery(text) {

  var arr = text.split(' of '); //'of' permutations
  for (var i in arr) {
    if (i == 0) {
      propertystring = arr[i];
    } else {
      propertystring += ' of ' + arr[i];
    }
    topicstring = text.replace(propertystring, '');
    topicstring = topicstring.replace(/^ of /i, '');

    //try fitting them to the graph
    if (topicstring != '' && propertystring != '') {
      var the = reconcile(topicstring, propertystring);
      var topic = the.topic || '';
      var property = the.property || '';
      if (the.property != '') {
        return the;
      } //if results are really good, its the right permutation
    } //ifstring!empty
  } //for

  //we didn't find a property, but maybe we want to keep the topic
  if (arr.length == 2) {
    //maybetopic=arr[0];
    // return{property:'', topic:'',image:'',maybe:arr[0]};

    // var response=get_topic(topicstring);
    //response[0]["relevance:score"]
  }

  return {
    property: '',
    topic: '',
    image: ''
  };
}


///////////////////

//acre.write(JSON.stringify(parsepossesivequery("bill clinton's child ")));
function parsepossesivequery(text) {
  var arr = text.split("'s "); //'s permutations
  for (var i in arr) {
    if (i == 0) {
      var propertystring = arr[i];
    } else {
      propertystring += "'s " + arr[i];
    }
    var topicstring = text.replace(propertystring, '');
    topicstring = topicstring.replace(/^'s /i, '');
    // acre.write( topicstring+propertystring);
    //try fitting them to the graph
    if (topicstring != '' && propertystring != '') {
      var the = reconcile(propertystring, topicstring);
      var property = the.property || '';
      if (the.property != '') {
        return the;
      } //if results are good, its the right permutation

    } //ifstring!empty
  } //for
  return {
    property: '',
    topic: '',
    image: ''
  };
}

///////////////

//acre.write(JSON.stringify(parsewords("first burning man")));
function parsewords(text) {

  var left = '';
  var right = '';
  var arr = text.split(' '); //permutations
  for (var i in arr) {
    if (left != '') {
      left += ' ';
    }
    left += arr[i];
    right = text.replace(left, '');
    right = right.replace(/^ /, '');
    //try fitting them to the graph
    if (left != '' && right != '') { //acre.write(left+'|'+right);
      var the = reconcile(left, right);
      var topic = the.topic || '';
      var property = the.property || '';
      var image = the.image || '';
      if (the.property != '') {
        return {
          property: property,
          topic: topic,
          image: image
        };
      }

      //switch
      var the = reconcile(right, left);
      var topic = the.topic || '';
      var property = the.property || '';
      var image = the.image || '';
      if (the.property != '') {
        return {
          property: property,
          topic: topic,
          image: image
        };
      }



    }
  } //for
  return {
    property: '',
    topic: topic,
    image: image
  };
}



////////////
//acre.write(JSON.stringify(getdata("/education/educational_institution/students_graduates","/en/university_of_victoria" )));
function getdata(property, topic) {
  var answer = [];
  var answerid = [];
  var image = [];

  if (property != '' && topic != '') {
    query = '[{"id":"' + topic + '", "' + property + '":[{"*":[],"limit":30 }] }]';
    try {
      query = JSON.parse(query);
      var the = acre.freebase.mqlread(query);
      //try as an id query
      try {
        var str = 'var theanswer=the.result[0]["' + property + '"]||"";';
        eval(str);

        for (var a in theanswer) {
          answer[a] = theanswer[a].name + '';
          answerid[a] = theanswer[a].id[0] || "";

          if (answerid[a] != '' && answer[a] == '') { //its a cvt because it has no name
            answer[a] = getcvt(answerid[a]) || 'oops';
            //acre.write(answerid[a]);
          }
          if (answerid[a] != '' && answer[a] != '') { //get an image
            try {
              query = [{
                "id": answerid[a],
                "/common/topic/image": [{
                  "id": null,
                  "limit": 1,
                  "optional": true
                }]
              }]
              var the = acre.freebase.mqlread(query).result;
              image[a] = the[0]["/common/topic/image"][0]["id"] || '';
            } catch (e) {}
          }

        } //for
        return {
          answer: answer,
          answerid: answerid,
          image: image
        };
      } catch (e) {} //id


      //try as value query
      try {
        var str = 'answer=the.result[0]["' + property + '"][0].value||"";';
        eval(str);
        answer = '' + answer;
        return {
          answer: answer,
          answerid: '',
          image: ''
        };
      } catch (e2) {}


    } catch (e) {} //that query failed. so..
    return {
      answer: '',
      answerid: '',
      image: ''
    };
  } //if result!empty
}

////////////////////////////////////////////



//var property_string='contained by';var id='/en/university_of_baghdad'; acre.write(getproperties(property_string, id) );
function getproperties(property_string, id) {

  var matches = [];
  var m = 0;

  var query = [{
    "id": id,
    "type": [{
      "id": null,
      "/type/type/properties": [{
        "type": "/type/property",
        "id": null,
        "name": null,
        "/type/reflect/any_reverse": [{
          "id": null,
          "optional": true,
          "type": "/base/natlang/property_alias",
          "/base/natlang/property_alias/alias": null
        }]
      }]
    }]
  }]

  var foundprop = 0;
  try {
    var the = acre.freebase.mqlread(query).result;
    // var  result=JSON.stringify(the[0].type[0]["/type/type/properties"][1].id);
    for (var t in the[0].type) { //acre.write(the[0].type[t].id);
      var foundone = 0;
      for (var p in the[0].type[t]["/type/type/properties"]) { //acre.write(JSON.stringify(the[0].type[t]["/type/type/properties"][p]["/type/reflect/any_reverse"][0]["/base/natlang/property_alias/alias"])+'----');
        var property = the[0].type[t]["/type/type/properties"][p].name;
        property = property.toLowerCase();
        var distance = levenshtein(property_string, property) + 0;
        if (debug) {
          acre.write('  ' + property_string + ' ' + property + ' =' + distance);
        }
        // acre.write(property_string+' '+property +distance+'------');
        if (distance < 2) {

          if (debug) {
            acre.write('    ------------matched property name' + property_string + ' to-' + property + ' because distance=' + distance + '------');
          }
          matches[m] = the[0].type[t]["/type/type/properties"][p].id;
          m++;
          foundone = 1; //break;
          continue; //it keeps going,
        }
        if (foundone != 1) {
          for (var n in the[0].type[t]["/type/type/properties"][p]["/type/reflect/any_reverse"]) {
            try {
              var alias = the[0].type[t]["/type/type/properties"][p]["/type/reflect/any_reverse"][n]["/base/natlang/property_alias/alias"] || '';
              // acre.write(the[0].type[t]["/type/type/properties"][p]["/type/reflect/any_reverse"][n]["/base/natlang/property_alias/alias"]+'  ');
              alias = alias.toLowerCase();
              var distance = levenshtein(property_string, alias) + 0;

              if (debug) {
                acre.write('-  aliasq ' + property_string + ' ' + alias + ' =' + distance);
              }
              // acre.write(property_string+' '+property +distance+'------');
              if (distance < 2) {


                if (debug) {
                  acre.write('    ------------matched property alias ' + property_string + ' to-' + alias + ' because distance=' + distance + '------');
                }

                matches[m] = the[0].type[t]["/type/type/properties"][p].id;
                m++;
                foundprop = 1;
                break;
              }

            } catch (e) {
              acre.write('aliaserror' + e);
            }
          } //foralias
        } //if!foundprop
        if (foundprop == 1) {
          break;
        }
      } //forprop
      if (foundprop == 1) {
        break;
      }
    } //fortype
    // acre.write(result);
  } catch (e) {
    acre.write('bottom' + e);
  }
  return matches;
}



function levenshtein(str1, str2) {
  if (str1 != null && str2 != null) {
    var l1 = str1.length,
      l2 = str2.length;
    if (Math.min(l1, l2) === 0) {
      return Math.max(l1, l2);
    }
    var i = 0,
      j = 0,
      d = [];
    for (i = 0; i <= l1; i++) {
      d[i] = [];
      d[i][0] = i;
    }
    for (j = 0; j <= l2; j++) {
      d[0][j] = j;
    }
    for (i = 1; i <= l1; i++) {
      for (j = 1; j <= l2; j++) {
        d[i][j] = Math.min(
          d[i - 1][j] + 1,
          d[i][j - 1] + 1,
          d[i - 1][j - 1] + (str1.charAt(i - 1) === str2.charAt(j - 1) ? 0 : 1)
        );
      }
    }
  }
  return d[l1][l2];
}
/////////////////////////////////



/////////////////
//var the=reconcile('bill clinton', 'child');acre.write(' answer='+the.topic+'  -'+the.property+' - '+the.image);
function reconcile(topicstring, propertystring) {
  var first = '';
  var image = '';

  //first, try to clean it
  propertystring = propertystring.replace(/^the /, '');


  if (debug) {
    acre.write('       ============trying ' + topicstring + ' | ' + propertystring + '----');
  }


  //next, get the topic
  topicstring = singularize(topicstring) || topicstring;
  var result = get_topic(topicstring); //reconcile to possibles
  // acre.write(topicstring+JSON.stringify(result));

  try {
    if (result[0]["relevance:score"] > 20) {
      var first = result[0].id || '';
      try {
        var image = result[0].image.id || '';
      } catch (e) {
        var image = '';
      }
    }
  } catch (e) {
    return {
      property: '',
      topic: '',
      image: ''
    }
  }

  for (var i in result) {
    var id = result[i].id || '';
    if (debug) {
      acre.write('--  looking for properties of' + id + '---')
    };

    //get its properties
    var property = singularize(propertystring) || propertystring;
    var matches = getproperties(property, id); //levenshtein match against property names
    if (debug) {
      acre.write('found=' + matches + '-')
    };

    var property = '';
    try {
      property = matches[0] || '';
    } catch (e) {}
    if (property != '') {
      return {
        property: property,
        topic: id,
        image: image
      };
    }
  } //for


  //one last shot.....
  if (propertystring.match(/^ ?number of /i)) {
    propertystring = propertystring.replace(/^ ?number of /i, '');
    var tryit = reconcile(topicstring, propertystring); //recursive
    if (tryit.property != '') {
      return tryit;
    }
  }

  return {
    property: '',
    topic: first,
    image: image
  };
} //fn

///////////////////////////////
//////////////////////


//acre.write(JSON.stringify(typefilterwords("titanic ship")));
function typefilterwords(text) {

  var str = '';
  var type = '';
  var result = emptyit();
  var arr = text.split(' '); //

  type = arr[0];
  str = text.replace(type, ''); //try first word
  var result = reconcile_topic_type(str, type);
  // acre.write(str+'000'+type);

  try {
    if (result.answerid[0] != null && result.answerid[0] != '') {
      return {
        subject: '',
        property: '',
        image: '',
        explanation: 'filtered ' + type,
        did: text,
        method: 'filter',
        result: result
      };

    } //if
  } catch (e) {}

  type = arr[arr.length - 1];
  str = text.replace(type, ''); //try last word
  var result = reconcile_topic_type(str, type);

  try {
    if (result.answerid[0] != null && result.answerid[0] != '') {
      return {
        subject: type,
        property: '',
        image: '',
        explanation: 'filtered ',
        did: text,
        method: 'filter',
        result: result
      };

    } //if
  } catch (e) {}
  return {
    subject: '',
    property: '',
    image: '',
    explanation: 'filtered ',
    did: text,
    method: 'filter',
    result: ''
  };
}

////////////////////////////////////////

// acre.write(JSON.stringify(reconcile_topic_type('winston churchill','school')));
function reconcile_topic_type(topic_string, type_string) {
  if (debug) {
    acre.write('       ============topic-type.  trying ' + topic_string + ' | ' + type_string + '----');
  }
  var result = emptyit();

  //search typestring
  type_string = singularize(type_string) || type_string;
  // acre.write('       ============topic-type.  trying '+topic_string+' | '+type_string+'----');
  var search_url = 'http://www.freebase.com/api/service/search?type=/type/type&type_strict=all&query=' + encodeURI(type_string);
  var typeresponse = JSON.parse(acre.urlfetch(search_url).body).result;
  try {
    if (typeresponse[0]["relevance:score"] <= 20) {
      return result;
    }
  } catch (e) {
    return result;
  }
  var type = typeresponse[0].id;
  // acre.write(type);

  //search topicstring
  var search_url = 'http://www.freebase.com/api/service/search?type=' + type + '&type_strict=all&query=' + encodeURI(topic_string);
  var response = JSON.parse(acre.urlfetch(search_url).body).result;
  // acre.write(JSON.stringify(search_url+response));
  try {
    if (response[0]["relevance:score"] <= 10) {
      return result;
    }

  } catch (e) {
    return result;
  }


  var result = emptyit();

  for (var t in response) {
    if (response[t]["relevance:score"] < 10) {
      break;
    }
    if (debug) {
      acre.write('matched' + response[t].type[0].id + '   ' + typeresponse[t].name + '--');
    } //er
    result.answerid[t] = response[t].id || '';
    result.answer[t] = response[t].name || '';
    try {
      result.image[t] = response[t].image.id || '';
    } catch (e) {
      result.image[t] = '';
    }
  } //t

  return result;
}
//////////////////////




//acre.write(JSON.stringify(listof('/event/disaster')));
function listof(type) {
  // acre.write('|'+type+'|');
  try {
    var query = [{
      "type": type,
      "id": null,
      "name": null,
      "/common/topic/image": [{
        "id": null,
        "limit": 1,
        "optional": true
      }],
      "limit": 30
    }]
    var response = acre.freebase.mqlread(query).result;


  } catch (e) {
    acre.write('lala' + e);
  }

  var result = {};
  result.answerid = [];
  result.answer = [];
  result.image = [];
  result.about = [];
  for (var i in response) {
    result.answer[i] = response[i].name;
    result.answerid[i] = response[i].id;
    try {
      result.image[i] = response[i]["/common/topic/image"][0].id;
    } catch (e) {
      result.image[i] = '';
    }
    result.about[i] = '';
  }



  return result;

}

//////////////////////////
//////////////////////////






///////////


//acre.write(JSON.stringify(prepositions('films by paris hilton')));
function prepositions(text) {

  var propertystring = '';
  var topicstring = '';
  var topic = '';
  var property = '';

  var prepositions =
    ["with",
    "on",
    "in",
    "at",
    "from",
    "for",
    "by"
  ];

  for (var p in prepositions) {
    if (text.match(prepositions[p])) {

      var preposition = prepositions[p];

      var arr = text.split(' ' + preposition + ' '); //permutations
      for (var i in arr) {
        if (i == 0) {
          propertystring = arr[i];
        } else {
          propertystring += ' ' + preposition + ' ' + arr[i];
        }
        topicstring = text.replace(propertystring, '');

        var regex = new RegExp('^ ?' + preposition + ' ');
        topicstring = topicstring.replace(regex, '');
        if (topicstring != '' && propertystring != '') {

          if (debug) {
            acre.write(topicstring + ' | ' + propertystring);
          }


          //try fitting them to the graph
          try {
            if (topicstring != '' && propertystring != '') {
              var the = reconcile(topicstring, propertystring);
              var topic = the.topic || '';
              var property = the.property || '';
              if (the.property != '') {
                return the;
              } //if results are really good, its the right permutation
            } //ifstring!empty
          } catch (e) {}




        }

      } //for

    } //match
  } //f prep


  return {
    property: '',
    topic: '',
    image: ''
  };
}




//////////////////////