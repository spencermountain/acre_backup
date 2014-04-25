var debug = 0;


var functions = acre.require('functions'); //the guts

var q = acre.request.params.q || '';
//if(q!=''){acre.write(JSON.stringify(answer(q)))}

/*
this is how it looks when its done
{
    "subject": "",
    "property": "",
    "image": "",
    "did": "search bach",
    "method": "search",
    "explanation":"searched for",
    "result": {
        "answerid": [
            "/en/johann_sebastian_bach"
        ],
        "answer": [
            "Johann Sebastian Bach"
        ],
        "image": [
            "/guid/9202a8c04000641f8000000004a6e195"
        ],
        "about": [
            "/music/artist"
        ]
    }
}
*/

//acre.write(JSON.stringify(answer("university of toronto")));
function answer(text) {
  var property = '';
  var topic = '';
  var image = '';
  var done = 0;
  var didtext = text;
  var method = '';
  var trytext = '';
  var maybetopic = '';


  //ok, so now lets begin
  var result = functions.emptyit();

  if (text == '' || text == null) {
    if (debug) {
      acre.write('totally empty');
    }
    return result
  };

  //cleanup text
  text = functions.trim(text)
  text = text.toLowerCase();
  text = text.replace(/"/g, '');
  text = text.replace(/\>/g, '');
  text = text.replace(/\</g, '');
  text = text.replace(/;/g, '');
  // text=encodeURI(text);

  //if there's a 'what is/are' , try to answer it without it
  if (text.match(/^(what|why|how) (is|are|'s) [^ ]/)) {
    var trytext = text.replace(/^(what|why|how) (is|are|'s) (the )?/i, '');
    if (debug) {
      acre.write('---(doing ' + trytext + 'first)---');
    }
    var shorty = answer(trytext); //recursive
    if (shorty.result.answer != null || shorty.result.answerid != null) //then it found an answer
    {
      return shorty;
    } //else, just continue on and answer the (whole) query
  }

  //if there's a 'list...' , try to answer it without it
  if (text.match(/^list /)) {
    var trytext = text.replace(/^list (of )?/, '');
    if (debug) {
      acre.write('---(doing ' + trytext + 'first)---');
    }
    var shorty = answer(trytext); //recursive
    if (shorty.result.answer != null || shorty.result.answerid != null) //then it found an answer
    {
      return shorty;
    } //else, just continue on and answer the (whole) query
  }

  console.log(text);

  //first loook for directives///
  /////////////////////
  /*
//if specified 'list.. something'
    if(done==0){
        if(text.match(/^list /)){
      if (debug){  console.log('list');acre.write('*****list q*****');}
      var result=functions.emptyit();
       var trytext= text.replace(/^list (of )?/,'');
           trytext=functions.singularize(trytext)||trytext;
           trytext=functions.get_any(trytext,'/type/type');
          try{var type=trytext[0].id||'';
          if(type!=''){
          var result=functions.listof(type)||{};
           if(result.answer[0]!=null&&result.answer[0]!=''){
          method='list'; done=1;

             return {subject:type,property:'',image:'', explanation:'list of ', did:didtext, method:method, result:result};
          }
         }
       }catch(e){}
    }
  }//if done*/




  //do a quick search to check if its just a topic
  if (done == 0) {
    if (debug) {
      console.log('qsearch');
      acre.write('*****quicksearch*****');
    }
    var quick = functions.get_topic(text);
    var result = functions.emptyit();
    try {
      if (debug) {
        acre.write('score= ' + quick[0]["relevance:score"]);
      }

      if (quick[0]["relevance:score"] > 75) {
        var response = quick;
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
        if (result.answer[0] != null && result.answer[0] != '') {
          method = 'quicksearch';
          var explanation = 'searched for ' + text;
          return {
            subject: '',
            property: '',
            image: '',
            explanation: explanation,
            did: didtext,
            method: method,
            result: result
          };
        }
      } //ifgood
    } catch (e) {}
  } //done






  //if specified 'type.. something'
  if (done == 0) {
    if (text.match(/type/) && (text.match(/^type [^ ]*/) || text.match(/[^ ] type$/))) {

      if (debug) {
        console.log('type');
        acre.write('*****type q*****');
      }
      trytext = text.replace(/^type /, '');
      trytext = trytext.replace(/ type$/, '');
      var response = functions.get_any(trytext, '/type/type');


    } //if type
  } //if done


  //if specified 'user.. something'
  if (done == 0) {
    if (text.match(/user/) && (text.match(/^user [^ ]*/) || text.match(/[^ ]* user$/))) {

      if (debug) {
        console.log('user');
        acre.write('*****user q*****');
      }
      trytext = text.replace(/^user /, '');
      trytext = trytext.replace(/ user$/, '');
      var response = functions.get_any(trytext, '/type/user');
      var result = functions.emptyit();
      for (var i in response) {
        result.answer[i] = response[i].name;
        result.answerid[i] = response[i].id;
        result.about[i] = response[i].id;
        result.image[i] = '';
      }
      done = 1;
      method = 'user';

      var explanation = 'searched for users named ' + trytext;
      return {
        subject: '',
        property: '',
        image: '',
        explanation: explanation,
        did: didtext,
        method: method,
        result: result
      };
    } //if type
  } //if done

  //if specified 'property.. something'
  if (done == 0) {
    if (text.match('property') && (text.match(/^ ?property [^ ]*/) || text.match(/[^ ]* property ?$/))) {

      if (debug) {
        console.log('prop');
        acre.write('*****property q*****');
      }
      trytext = text.replace(/^property /, '');
      trytext = trytext.replace(/ property$/, '');
      var response = functions.get_any(trytext, '/type/property');
      var result = functions.emptyit();
      for (var i in response) {
        result.answer[i] = response[i].name;
        result.answerid[i] = response[i].id;
        result.about[i] = response[i].id;
        result.image[i] = '';
      }
      done = 1;
      method = 'property';

      var explanation = 'searched for properties named ' + trytext;
      return {
        subject: '',
        property: '',
        image: '',
        explanation: explanation,
        did: didtext,
        method: method,
        result: result
      };
    } //if prop
  } //if done

  //if specified 'base.. something'
  if (done == 0) {
    if (text.match('base') && (text.match(/^ ?base [^ ]*/) || text.match(/[^ ]* base ?$/))) {

      if (debug) {
        console.log('base');
        acre.write('*****base q*****');
      }
      trytext = text.replace(/^base /, '');
      trytext = trytext.replace(/ base$/, '');
      var response = functions.get_any(trytext, '/type/domain');
      var result = functions.emptyit();
      for (var i in response) {
        result.answer[i] = response[i].name;
        result.answerid[i] = response[i].id;
        result.about[i] = response[i].id;
        result.image[i] = '';
      }
      done = 1;
      method = 'base';
      var explanation = 'searched for bases named ' + trytext;
      return {
        subject: '',
        property: '',
        image: '',
        explanation: explanation,
        did: didtext,
        method: method,
        result: result
      };
    } //if type
  } //if done

  //search
  if (done == 0) {
    if (text.match('search') && (text.match(/^search [^ ]*/) || text.match(/[^ ]* search$/) || text.match(/^\?.*/))) {

      if (debug) {
        console.log('s');
        acre.write('*****search q*****');
      }
      trytext = text.replace(/^search (for )?/, '');
      trytext = trytext.replace(/ search$/, '');
      trytext = trytext.replace(/^\? ?/, ''); //acre.write('ll'+text);

      var result = functions.emptyit();
      var response = functions.get_topic(trytext);
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

      var explanation = 'searched for ' + trytext;
      return {
        subject: '',
        property: '',
        image: '',
        explanation: explanation,
        did: didtext,
        method: method,
        result: result
      };
    } //if type
  } //if done


  //timezone
  if (done == 0) {
    if (text.match('time') && (text.match(/^(current )?time [^ ]*/) || text.match(/[^ ] (current)? time$/))) {

      if (debug) {
        console.log('time');
        acre.write('*****time q*****');
      }
      trytext = text.replace(/^(current )?time (of|in)?/, '');
      trytext = trytext.replace(/ (current)? time$/, '');

      var result = functions.emptyit();
      var response = acre.require('timezone').time(trytext);
      for (var i in response) {
        result.answer[i] = response[i].time;
        result.answerid[i] = '';
        result.image[i] = '';
      }
      done = 1;
      method = 'timezone';

      var explanation = 'current time of ' + trytext;
      return {
        subject: response[0].topic,
        property: '',
        image: response[0].image,
        explanation: explanation,
        did: didtext,
        method: method,
        result: result
      };
    } //if type
  } //if done



  //if input is a url, reconcile that biotch
  if (done == 0) {
    if (text.match('.') && text.match(/^(http|www)/) && !text.match(' ')) { // website

      if (debug) {
        console.log('link');
        acre.write('*****linker q*****');
      }

      var result = functions.emptyit();
      try {
        var response = acre.require('linker').linker(didtext);;

        /// acre.write(JSON.stringify(response));
        if (response.result.answerid[0] != '' && response.result.answerid[0] != null) {
          return response;
        }
      } catch (e) {}
    } //if id
  }

  //if input is an id, dont reconcile, just get that biotch
  if (done == 0) {
    if (text.match(/^\/[^ ]*\/[^ ]./)) { // ex /guid/something

      if (debug) {
        console.log('id');
        acre.write('*****id q*****');
      }
      var query = [{
        "/common/topic/image": [{
          "id": null,
          "limit": 1,
          "optional": true
        }],
        "id": text,
        "name": null
      }]
      try {
        var results = acre.freebase.MqlRead(query).result; //acre.write(JSON.stringify(result));
        var result = functions.emptyit();
        result.answer[0] = results[0].name;
        result.answerid[0] = results[0].id;
        try {
          result.image[0] = results[0]["/common/topic/image"][0].id;
        } catch (e) {
          result.image[0] = '';
        }
        done = 1;
        method = 'id';

        var explanation = 'matched ' + trytext;
        return {
          subject: '',
          property: '',
          image: '',
          explanation: explanation,
          did: didtext,
          method: method,
          result: result
        };
      } catch (e) {}
    } //if id
  }

  /////if specified topic ...(filter) ///////////
  if (done == 0) {
    if (text.match(/\(.*\)/)) { //acre.write('filter');

      if (debug) {
        console.log('(filter)');
        acre.write('*****strongfilter q*****');
      }
      var filter = text.match(/\(.*\)/);
      filter = filter[0].replace('(', '');
      filter = filter.replace(')', '');
      trytext = text.replace(/\(.*\)/, '');
      var result = functions.emptyit();
      var result = functions.reconcile_topic_type(trytext, filter) || {};
      if (result.answerid != '') {
        done = 1;
        method = 'strongfilter';
        var explanation = 'searched for a ' + filter + ' that matches ' + trytext;
        return {
          subject: '',
          property: '',
          image: '',
          explanation: explanation,
          did: didtext,
          method: method,
          result: result
        };
      }
      maybetopic = trytext;
    }
  }


  /////parse as [type] named 'string'///////////
  if (done == 0) {
    if (text.match(/ (named|titled|called) /)) {
      if (debug) {
        console.log('named');
        acre.write('*****named  q*****');
      }
      var result = functions.emptyit();
      var arr = text.split(' named ');
      try {
        var result = functions.reconcile_topic_type(arr[1], arr[0]) || result;
        if (result.answerid[0] != '' && result.answerid[0] != null) {
          done = 1;
          method = 'filter';
          var explanation = 'searched for ' + text;
          return {
            subject: '',
            property: '',
            image: '',
            explanation: explanation,
            did: didtext,
            method: method,
            result: result
          };
        }
      } catch (e) {}
    }
  }



  //maybe is the form [property] of [topic]
  if (done == 0) { //
    if (text.match(/[^ ] of [^ ]/i)) {
      if (debug) {
        console.log('of');
        acre.write('*****of q good*****');
      }
      var result = functions.emptyit();
      var parsed = functions.parseofquery(text);
      if (parsed.property != '' && parsed.topic != '') {
        var topic = parsed.topic;
        var property = parsed.property;
        var image = parsed.image;
        var result = functions.getdata(property, topic); // returns {answer:answer, answerid:'',image:''};
        done = 1;
        method = 'of question';
        var explanation = 'understood ';
        return {
          subject: topic,
          property: property,
          image: image,
          explanation: explanation,
          did: didtext,
          method: method,
          result: result
        };
      }
      maybetopic = text.replace(/[^ ]* of /i, '');
    } //has of
  }



  //maybe is the form  [topic]'s property
  if (done == 0) { //
    if (text.match(/[^ ]'s [^ ]/)) {
      if (debug) {
        console.log('posessional');
        acre.write('*****pos q good*****');
      }
      var result = functions.emptyit();
      var parsed = functions.parsepossesivequery(text);
      console.log('endposessional');
      if (parsed.property != '' && parsed.topic != '') {
        var topic = parsed.topic;
        var property = parsed.property;
        var image = parsed.image;
        var result = functions.getdata(property, topic); // returns {answer:answer, answerid:'',image:''};
        done = 1;
        method = 'question';
        var explanation = 'answered ';
        return {
          subject: topic,
          property: property,
          image: image,
          explanation: explanation,
          did: didtext,
          method: method,
          result: result
        };
      }

      maybetopic = text.replace(/'s .*/i, '');
    } //has of
  }









  //ok, now i mean business
  var templates = acre.require('templates');
  if (debug) {
    console.log('loaded tmplates');
    acre.write('*****templates*****');
  }
  ////


  //if maybe specified 'type in location'
  if (done == 0) {
    if (text.match(/[^ ] (in|of|within|inside) [^ ]/i)) {
      if (debug) {
        console.log('locat');
        acre.write('*****location q*****');
      }
      var result = functions.emptyit();
      var result = templates.type_location(text) || {};
      try {
        if (result.answer[0] != null && result.answer[0] != '') {
          method = 'location';
          done = 1;

          var explanation = 'list of locations ' + text;
          return {
            subject: '',
            property: '',
            image: '',
            explanation: explanation,
            did: didtext,
            method: method,
            result: result
          };
        }
      } catch (e) {}
      maybetopic = text.replace(/.* (in|of|within|inside) /i, '');
    }
  } //if done



  //if it uses a preposition, like 'films by robert redford' (they're a little more vague than an 'of' query)
  if (done == 0) {
    if (text.match(/ (by|from|in|for|on|with|at) /)) {
      if (debug) {
        console.log('prep');
        acre.write('*****preposition q*****');
      }

      var result = functions.emptyit();
      var parsed = functions.prepositions(text);
      if (parsed.property != '' && parsed.topic != '') {
        var topic = parsed.topic;
        var property = parsed.property;
        var image = parsed.image;
        var result = functions.getdata(property, topic); // returns {answer:answer, answerid:'',image:''};
        done = 1;
        method = 'preposition';
        var explanation = 'answered ';
        return {
          subject: topic,
          property: property,
          image: image,
          explanation: explanation,
          did: didtext,
          method: method,
          result: result
        };
      }

      maybetopic = text.replace(/[^ ]* (by|from|for|in|on|with|at) /i, '');
    }
  } //if done




  //if maybe specified 'who is don juan'
  if (done == 0) {
    if (text.match(/^who (was|is) [^ ]/i)) {
      var trytext = text.replace(/^who (was|is) /, '')
      if (debug) {
        console.log('who');
        acre.write('*****whowas q*****');
      }
      var result = functions.emptyit();
      var response = functions.get_any(trytext, '/people/person');
      for (var i in response) {
        result.answer[i] = response[i].name;
        result.answerid[i] = response[i].id;
        result.about[i] = '';
        try {
          result.image[i] = response[i].image.id;
        } catch (e) {
          result.image[i] = '';
        }
      }
      try {
        if (result.answer[0] != null && result.answer[0] != '') {
          method = 'whowas';
          done = 1;
          var explanation = 'who is ' + trytext;
          return {
            subject: '',
            property: '',
            image: '',
            explanation: explanation,
            did: didtext,
            method: method,
            result: result
          };
        }
      } catch (e) {}
      maybetopic = trytext;
    }
  } //if done





  //if maybe specified 'where is location'
  if (done == 0) {
    if (text.match(/^where (is|was) [^ ]/i) || text.match(/^location of [^ ]/i)) {
      if (debug) {
        console.log('whereis');
        acre.write('*****whereis q*****');
      }
      var result = functions.emptyit();
      var response = templates.whereis(text);
      try {
        if (response.result.answer[0] != null && response.result.answer[0] != '') {
          return response;
        }
      } catch (e) {}
      maybetopic = text.replace(/^where (is|was) /i, '');
      maybetopic = maybetopic.replace(/^location of (the)? /i, '');
    }
  } //if done


  //if maybe specified 'when was event'
  if (done == 0) {
    if (text.match(/^when (was|is|did) [^ ]/i)) {
      if (debug) {
        console.log('when');
        acre.write('*****whenwas q*****');
      }
      var result = functions.emptyit();
      var response = templates.whenwas(text) || {};
      try {
        if (response.result.answer[0] != null && response.result.answer[0] != '') {
          return response;
        }
      } catch (e) {}
      maybetopic = text.replace(/^when (was|is|did) (the )?/, '');
    }
  } //if done




  //if it is gender and a type, list them, like 'female politicians'
  if (done == 0) {
    if (text.match(/^(female|male|woman|man|girl|boy) *[^ ]/)) {
      if (debug) {
        console.log('gender');
        acre.write('*****gender q*****');
      }
      var result = functions.emptyit();
      try {
        var result = templates.genderandtype(text) || result;
        if (result.answer[0] != null && result.answer[0] != '') {
          method = 'gender';
          done = 1;
          var explanation = 'list of ' + text;
          return {
            subject: '',
            property: '',
            image: '',
            explanation: explanation,
            did: didtext,
            method: method,
            result: result
          };
        }
        maybetopic = trytext;
      } catch (e) {}
    }
  } //if done






  //end of clear directives, now just look for clues




  //if it is demonym and a type, list them, like 'canadian politicians'
  if (done == 0) {
    if (text.match(/[^ ] [^ ]/)) {
      if (debug) {
        console.log('demonym');
        acre.write('*****demonym q*****');
      }
      var result = functions.emptyit();
      try {
        var result = templates.demonymandtype(text) || result;
        if (result.answer[0] != null && result.answer[0] != '') {
          method = 'demonym';
          done = 1;
          var explanation = 'listing some ' + text;
          return {
            subject: '',
            property: '',
            image: '',
            explanation: explanation,
            did: didtext,
            method: method,
            result: result
          };
        }
      } catch (e) {}
    }
  } //if done



  //if it is plural, see if it's a type, like 'politicians'
  if (done == 0) {
    if (text.match(/s$/)) {
      if (debug) {
        console.log('looselist');
        acre.write('*****looselist q*****');
      }
      var result = functions.emptyit();
      var trytext = functions.singularize(text) || text;
      trytext = functions.get_any(trytext, '/type/type'); //acre.write(trytext);
      try {
        var type = trytext[0].id || '';
        if (type != '') {
          var result = functions.listof(type) || {};
          if (result.answer[0] != null && result.answer[0] != '') {
            method = 'looselist';
            done = 1;
            var explanation = 'list of ';
            return {
              subject: type,
              property: '',
              image: '',
              explanation: explanation,
              did: didtext,
              method: method,
              result: result
            };
          }
        }
        maybetopic = trytext;
      } catch (e) {}
    }
  } //if done





  //use quick search with lower standards
  if (done == 0) {
    if (debug) {
      console.log('qsearch');
      acre.write('*****quicksearch50*****');
    }
    var result = functions.emptyit();
    try {
      if (quick[0]["relevance:score"] > 50) {
        var response = quick;
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
        if (result.answer[0] != null && result.answer[0] != '') {
          method = 'quicksearch2';
          var explanation = 'searched for ' + text;
          return {
            subject: '',
            property: '',
            image: '',
            explanation: explanation,
            did: didtext,
            method: method,
            result: result
          };
        }
      } //ifgood
    } catch (e) {}
  } //done




  ///no more  clues, begin more exaustive searches








  /////parse as unstructured question///////////
  if (done == 0) {
    if (text.match(/[^ ] [^ ]/)) {
      if (debug) {
        console.log('question');
        acre.write('*****question q*****');
      }
      var parsed = functions.parsequery(text);
      var result = functions.emptyit();
      if (parsed.property != '' && parsed.topic != '') {
        var topic = parsed.topic;
        var property = parsed.property;
        var image = parsed.image;
        var result = functions.getdata(property, topic); // returns {answer:answer, answerid:'',image:''};
        done = 1;
        method = 'unstructured question';

        var explanation = 'understood ';
        return {
          subject: topic,
          property: property,
          image: image,
          explanation: explanation,
          did: didtext,
          method: method,
          result: result
        };
      }
    }
  }

  //use maybetopic
  if (done == 0) {
    if (maybetopic != '') {
      if (debug) {
        console.log('maybetopic' + maybetopic);
        acre.write('*****maybetopic*****' + maybetopic);
      }

      try {
        var response = functions.search(maybetopic); //return response
        if (response.result.answer[0] != '' || response.result.answer[0] != null) {
          return response;
        } //if
      } catch (e) {}
    }
  }


  /////parse as unstrcuctured type filter///////////
  if (done == 0) {
    if (text.match(/[^ ] [^ ]/)) {
      if (debug) {
        console.log('softfilter');
        acre.write('*****softfilter  q*****');
      }
      var result = functions.emptyit();
      var response = functions.typefilterwords(text); //acre.write('kkkk'+JSON.stringify(response.result));
      try {
        if (response.result.answer[0] != '' || response.result.answer[0] != null) {
          done = 1;
          return response;
        }
      } catch (e) {}
    }
  }



  //use quick search with lower standards
  if (done == 0) {
    if (debug) {
      console.log('qsearch');
      acre.write('*****quicksearch*****');
    }
    var result = functions.emptyit();
    try {
      if (quick[0]["relevance:score"] > 5) {
        var response = quick;
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
        if (result.answer[0] != null && result.answer[0] != '') {
          method = 'quicksearch2';
          var explanation = 'searched for ' + text;
          return {
            subject: '',
            property: '',
            image: '',
            explanation: explanation,
            did: didtext,
            method: method,
            result: result
          };
        }
      } //ifgood
    } catch (e) {}
  } //done



  //if still not done, search it exaustively
  if (done == 0) {
    if (debug) {
      console.log('longsearch');
      acre.write('*****search q*****');
    }
    var result = functions.emptyit();



    var response = functions.search(text);
    try {
      if (response.result[0].id != null && response.result[0].id != '') {
        return response
      } //if
    } catch (e) {}
    //still found nothing. go word  by word...
    /*
      var words=text.split(' ');
    for (var i in words){
      var response=functions.search(words[i]); //acre.write(words[i]+'lllllllll'+JSON.stringify(response.result));
      try{ if(response.result.answerid[0]!=null&&response.result.answerid[0]!=''){
        return response
          }}catch(e){acre.write(words[i]+' nothing');}
          }//for
      */
  } //if done




  //if still nothing (eg. ksehfhbse), apologize
  if (done == 0) {
    var result = functions.emptyit();
    method = 'empty';
    var explanation = 'found nothing for ' + text;
    return {
      subject: '',
      property: '',
      image: '',
      explanation: explanation,
      did: didtext,
      method: method,
      result: result
    };
  }


  return {
    subject: topic,
    property: property,
    image: image,
    did: didtext,
    method: method,
    result: result
  };
}