export function cloneComplexInteractors(json) {

    // We'll need collections of our interactions and interactors for later..
    const interactions = json.data.filter(function (interaction) {
        return interaction.object === "interaction";
    });

    const instanceCount = new Map();

    // Loop through our interactions
    interactions.forEach(function (interaction) {

        // Get a collection of participants where the stoichiometry is greater than one.
        const complexesToClone = interaction.participants.filter(function (participant) {
            if (participant.interactorRef.indexOf("complex") !== -1) {
                return participant;
            }
        });

        // Loop through our participants that need expanding
        complexesToClone.forEach(function (participantComplex) {

            // Do we have an interactor? TODO: Will this affect complexes?
            const foundInteractor = findFirstObjWithAttr(interactions, "id", participantComplex.interactorRef);

            // If we found an interactor then we need to clone it.
            if (foundInteractor) {

                let count = instanceCount.get(participantComplex.interactorRef);
                if (count) {
                    count = count + 1;
                } else {
                    count = 1;
                }
                instanceCount.set(participantComplex.interactorRef, count);

                let i = count;

                if (i > 1) {
                    participantComplex.interactorRef = participantComplex.interactorRef + "_" + i;

                    // update features of complex
                    if (participantComplex.features) {
                        participantComplex.features.forEach(function (feature) {
                            feature.copiedfrom = feature.id;
                            // feature.id = feature.id + "_" + i;
                            // Also, adjust our sequence data
                            feature.sequenceData.forEach(function (sequenceData) {
                                sequenceData.participantRef = sequenceData.participantRef  + "_" + i;
                                //~ sequenceData.interactorRef = clonedInteractor.id;
                            });
                        });
                    }

                    const clonedInteractor = JSON.parse(JSON.stringify(foundInteractor));
                    clonedInteractor.id = clonedInteractor.id + "_" + i;

                    json.data.push(clonedInteractor);

                    for (let participant of clonedInteractor.participants) {
                        /********** PARTICIPANTS **********/
                        const clonedParticipant = participant;//JSON.parse(JSON.stringify(participant));

                        clonedParticipant.id = clonedParticipant.id + "_" + i;

                        // We need to relink to our binding site IDs:
                        if (clonedParticipant.features) {
                            clonedParticipant.features.forEach(function (feature) {

                                // feature.copiedfrom = feature.id;
                                feature.id = feature.id + "_" + i;
                                // Also, adjust our sequence data
                                feature.sequenceData.forEach(function (sequenceData) {
                                    sequenceData.participantRef = clonedParticipant.id;
                                    //~ sequenceData.interactorRef = clonedInteractor.id;
                                });

                                const lnCount = feature.linkedFeatures.length;
                                for (let ln = 0; ln < lnCount; ln++){
                                    // console.log(linkedFeature);
                                    feature.linkedFeatures[ln] = feature.linkedFeatures[ln] + "_" + i;
                                }

                            });
                        }
                    }
                }
            }
        });

    });

    return json;
}

// Returns the first object in an array that has an attribute with a matching value.
function findFirstObjWithAttr(collection, attribute, value) {
    for (let i = 0; i < collection.length; i += 1) {
        if (collection[i][attribute] === value) {
            return collection[i];
        }
    }
}