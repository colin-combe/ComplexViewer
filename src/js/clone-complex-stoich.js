export function cloneComplexesStoich(json) {

    // We'll need collections of our interactions and interactors for later..
    const interactions = json.data.filter(function (interaction) {
        return interaction.object === "interaction";
    });

    // Loop through our interactions
    interactions.forEach(function (interaction) {

        // Get a collection of complexes
        const complexesToClone = interaction.participants.filter(function (participant) {
            if (participant.interactorRef.indexOf("complex") !== -1) {
                return participant;
            }
        });

        // Loop through our participants that need expanding
        complexesToClone.forEach(function (complexToClone) {

            // Do we have an interactor? TODO: Will this affect complexes?
            const foundInteraction = findFirstObjWithAttr(interactions, "id", complexToClone.interactorRef);

            // If we found an interactor then we need to clone it.
            if (foundInteraction) {

                for (let i = 1; i < complexToClone.stoichiometry; i++) {
                    // if (i > 0) {

                        // update features of complex
                        if (complexToClone.features) {
                            complexToClone.features.forEach(function (feature) {
                                feature.copiedfrom = feature.id;
                                // feature.id = `${feature.id}_${i}`;
                                // Also, adjust our sequence data
                                feature.sequenceData.forEach(function (sequenceData) {
                                    sequenceData.participantRef = `${sequenceData.participantRef}_${i}`;
                                    //~ sequenceData.interactorRef = clonedInteractor.id;
                                });
                            });
                        }

                        const clonedInteraction = JSON.parse(JSON.stringify(foundInteraction));
                        clonedInteraction.sourceId = clonedInteraction.id;
                        clonedInteraction.id = `${clonedInteraction.id}_${i}`;
                        clonedInteraction.interactorRef = `${complexToClone.interactorRef}_${i}`;

                        json.data.push(clonedInteraction);

                        for (let participant of clonedInteraction.participants) {
                            /********** PARTICIPANTS **********/
                            const clonedParticipant = participant;//JSON.parse(JSON.stringify(participant));

                            clonedParticipant.id = `${clonedParticipant.id}_${i}`;

                           //  // We need to relink to our binding site IDs:
                            if (clonedParticipant.features) {
                                clonedParticipant.features.forEach(function (feature) {

                                    // feature.copiedfrom = feature.id;
                                    feature.id = `${feature.id}_${i}`;
                                    // Also, adjust our sequence data
                                    feature.sequenceData.forEach(function (sequenceData) {
                                        sequenceData.participantRef = clonedParticipant.id;
                                        //~ sequenceData.interactorRef = clonedInteractor.id;
                                    });

                                    const lnCount = feature.linkedFeatures.length;
                                    for (let ln = 0; ln < lnCount; ln++) {
                                        // console.log(linkedFeature);
                                        feature.linkedFeatures[ln] = `${feature.linkedFeatures[ln]}_${i}`;
                                    }

                                });
                            }
                        }
                        interaction.participants.push(clonedInteraction);
                    }
                }
            // }
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
