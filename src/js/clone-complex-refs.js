export function cloneComplexRefs(json) {

    // We'll need collections of our interactions and interactors for later..
    const interactions = json.data.filter(function (interaction) {
        return interaction.object === "interaction";
    });

    const instanceCount = new Map();

    // Loop through our interactions
    interactions.forEach(function (interaction) {

        // Get a collection of participants with 'complex' in interactorRef - not ideal way to get complexes
        const complexesToClone = interaction.participants.filter(function (participant) {
            if (participant.interactorRef.indexOf("complex") !== -1) {
                return participant;
            }
        });

        // Loop through our participants that need expanding
        complexesToClone.forEach(function (complexToClone) {

            // Do we have an interaction
            const foundInteraction = findFirstObjWithAttr(interactions, "id", complexToClone.interactorRef);

            // If we found an interaction then we need to clone it.
            if (foundInteraction) {
                let count = instanceCount.get(complexToClone.interactorRef);
                if (count) {
                    count = count + 1;
                } else {
                    count = 1;
                }
                instanceCount.set(complexToClone.interactorRef, count);

                let i = count;

                if (i > 1) {
                    cloneComplexParticipant(complexToClone, i);
                    json.data.push(cloneComplexInteraction(foundInteraction, i));
                }
            }
        });

    });

    // After all the complexes and participants have been cloned due to stoichiometry,
    // we need to check if any subcomplex needs to recursively also clone their participants.
    return cloneComplexClonesRecursively(json);
}

function cloneComplexClonesRecursively(json) {

    // We'll need collections of our interactions and interactors for later..
    const interactions = json.data.filter(function (interaction) {
        return interaction.object === "interaction";
    });

    // Loop through our interactions
    interactions.forEach(function (interaction) {
        json.data.push(...cloneClonedComplexParticipants(interactions, interaction));
    });

    return json;
}

function cloneClonedComplexParticipants(interactions, interaction) {
    const clonesInteractions = [];

    // We only try to clone participants from already cloned complexes
    const match = interaction.id.match(/.*_([0-9])+$/);
    if (match) {
        const i = match[1];

        // Get a collection of participants with 'complex' in interactorRef - not ideal way to get complexes
        const complexesToClone = interaction.participants.filter(function (participant) {
            if (participant.interactorRef.indexOf("complex") !== -1) {
                return participant;
            }
        });

        // Loop through our participants that need expanding
        complexesToClone.forEach(function (complexToClone) {

            // Do we have an interaction
            const foundInteraction = findFirstObjWithAttr(interactions, "id", complexToClone.interactorRef);

            // If we found an interaction then we need to clone it.
            if (foundInteraction) {
                cloneComplexParticipant(complexToClone, i);
                const clonedInteraction = cloneComplexInteraction(foundInteraction, i);
                clonesInteractions.push(clonedInteraction);
                clonesInteractions.push(...cloneClonedComplexParticipants(interactions, clonedInteraction));
            }
        });
    }

    return clonesInteractions;
}

function cloneComplexParticipant(complexToClone, i) {
    // this looks weird, don't think it'll work if more than 2 refs to complex?
    complexToClone.interactorRef = `${complexToClone.interactorRef}_${i}`;

    // update features of complex
    if (complexToClone.features) {
        complexToClone.features.forEach(function (feature) {
            feature.copiedfrom = feature.id;
            // feature.id = `${feature.id}_${i}`;
            // Also, adjust our sequence data
            feature.sequenceData.forEach(function (sequenceData) {

                // Participant Ref may have already been updated, so we don't want to update it twice
                const match = sequenceData.participantRef.match(/^(.*)_([0-9])+$/);
                if (!match) {
                    sequenceData.participantRef = `${sequenceData.participantRef}_${i}`;
                }
                //~ sequenceData.interactorRef = clonedInteractor.id;
            });
        });
    }
}

function cloneComplexInteraction(interaction, i) {
    const clonedInteraction = JSON.parse(JSON.stringify(interaction));
    clonedInteraction.sourceId = clonedInteraction.id;
    clonedInteraction.id = `${clonedInteraction.id}_${i}`;

    for (let participant of clonedInteraction.participants) {
        /********** PARTICIPANTS **********/
        const clonedParticipant = participant;//JSON.parse(JSON.stringify(participant));

        clonedParticipant.id = `${clonedParticipant.id}_${i}`;

        // We need to relink to our binding site IDs:
        if (clonedParticipant.features) {
            clonedParticipant.features.forEach(function (feature) {

                // feature.copiedfrom = feature.id;
                feature.id = `${feature.id}_${i}`;
                // Also, adjust our sequence data
                feature.sequenceData.forEach(function (sequenceData) {
                    // sequenceData.participantRef = clonedParticipant.id;
                    //~ sequenceData.interactorRef = clonedInteractor.id;

                    // Participant Ref may have already been updated, so we don't want to update it twice
                    const match = sequenceData.participantRef.match(/^(.*)_([0-9])+$/);
                    if (!match) {
                        sequenceData.participantRef = `${sequenceData.participantRef}_${i}`;
                    }
                });

                const lnCount = feature.linkedFeatures.length;
                for (let ln = 0; ln < lnCount; ln++){
                    // console.log(linkedFeature);
                    feature.linkedFeatures[ln] = `${feature.linkedFeatures[ln]}_${i}`;
                }

            });
        }
    }

    return clonedInteraction;
}

// Returns the first object in an array that has an attribute with a matching value.
function findFirstObjWithAttr(collection, attribute, value) {
    for (let i = 0; i < collection.length; i += 1) {
        if (collection[i][attribute] === value) {
            return collection[i];
        }
    }
}
