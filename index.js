var request = require("request");
var striptags = require('striptags');

// Route the incoming request based on type (LaunchRequest, IntentRequest,
// etc.) The JSON body of the request is provided in the event parameter.
exports.handler = function (event, context) {
    try {
        console.log("event.session.application.applicationId=" + event.session.application.applicationId);
        /**
         * Uncomment this if statement and populate with your skill's application ID to
         * prevent someone else from configuring a skill that sends requests to this function.
         */

        // if (event.session.application.applicationId !== "") {
        //     context.fail("Invalid Application ID");
        //  }

        if (event.session.new) {
            onSessionStarted({requestId: event.request.requestId}, event.session);
        }

        if (event.request.type === "LaunchRequest") {
            onLaunch(event.request,
                event.session,
                function callback(sessionAttributes, speechletResponse) {
                    context.succeed(buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === "IntentRequest") {
            onIntent(event.request,
                event.session,
                function callback(sessionAttributes, speechletResponse) {
                    context.succeed(buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === "SessionEndedRequest") {
            onSessionEnded(event.request, event.session);
            context.succeed();
        }
    } catch (e) {
        context.fail("Exception: " + e);
    }
};

/**
 * Called when the session starts.
 */
function onSessionStarted(sessionStartedRequest, session) {
}

/**
 * Called when the user invokes the skill without specifying what they want.
 */
function onLaunch(launchRequest, session, callback) {
    getWelcomeResponse(callback)
}

/**
 * Called when the user specifies an intent for this skill.
 */
function onIntent(intentRequest, session, callback) {

    var intent = intentRequest.intent;
    var intentName = intentRequest.intent.name;
    var medicine = intent.slots.medicine.value.toLowerCase();

    switch(intentName) {
        case "AboutIntent":
            var section = "about";
            break;
        case "KeyFactsIntent":
            var section = "key-facts";
            break;
        case "WhoCanTakeIntent":
            var section = "who";
            break;
        case "HowWhenToTakeIntent":
            var section = "how-and";
            break;
        case "SideEffectsIntent":
            var section = "side-effects";
            break;
        case "HowToCopeIntent":
            var section = "how-to";
            break;
        case "CautionsIntent":
            var section = "cautions";
            break;
        case "PregnancyBreastFeedingIntent":
            var section = "pregnancy";
            break;
        default:
            var section = "about";
    }

    var url = "https://beta-platform-review-beta-medicines.dev.beta.nhschoices.net/content-api/medicines/" + medicine + "?section=" + section;

    request.get(url, function(error, response, body) {
      var d = JSON.parse(body);
      var result1 = striptags(d.value.section_content[0].value);
      var result = result1.replace(/\./g, ". ").replace(/\n/g, "");
      var speechOutput = result;
      callback(session.attributes, buildSpeechletResponseWithoutCard(speechOutput, "", true));
    })
}

/**
 * Called when the user ends the session.
 * Is not called when the skill returns shouldEndSession=true.
 */
function onSessionEnded(sessionEndedRequest, session) {

}

// ------- Skill specific logic -------

function getWelcomeResponse(callback) {
    var speechOutput = "Welcome! Ask a question about a medicine, such as tell me about paracetamol or what are the side effects of tramadol";
    var reprompt = "Ask a question about a medicine such as tell me about paracetamol or what are the side effects of ibuprofen";
    var header = "Get Info";
    var shouldEndSession = false;
    var sessionAttributes = {
        "speechOutput" : speechOutput,
        "repromptText" : reprompt
    };

    callback(sessionAttributes, buildSpeechletResponse(header, speechOutput, reprompt, shouldEndSession));
}


// ------- Helper functions to build responses for Alexa -------
function buildSpeechletResponse(title, output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: "PlainText",
            text: output
        },
        card: {
            type: "Simple",
            title: title,
            content: output
        },
        reprompt: {
            outputSpeech: {
                type: "PlainText",
                text: repromptText
            }
        },
        shouldEndSession: shouldEndSession
    };
}

function buildSpeechletResponseWithoutCard(output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: "PlainText",
            text: output
        },
        reprompt: {
            outputSpeech: {
                type: "PlainText",
                text: repromptText
            }
        },
        shouldEndSession: shouldEndSession
    };
}

function buildResponse(sessionAttributes, speechletResponse) {
    return {
        version: "1.0",
        sessionAttributes: sessionAttributes,
        response: speechletResponse
    };
}
