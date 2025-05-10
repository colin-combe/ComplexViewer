export function cloneComplexRefs(json) {

    const instanceCount = new Map();

    // We'll need collections of our interactions and interactors for later..
    const interactions = json.data.filter(function (interaction) {
        return interaction.object === "interaction";
    });

    cloneComplexRefsRecursively(json, interactions, interactions, instanceCount);

    // After all the complexes and participants have been cloned due to stoichiometry,
    // we need to check if any subcomplex needs to recursively also clone their participants.
    return json;
}

function cloneComplexRefsRecursively(json, originalInteractions, interactionsToClone, instanceCount) {
    const newInteractionsToClone = [];

    // Loop through our interactions to clone
    interactionsToClone.forEach(function (interaction) {

        // Get a collection of participants with 'complex' in interactorRef - not ideal way to get complexes
        const complexesToClone = interaction.participants.filter(function (participant) {
            if (participant.interactorRef.indexOf("complex") !== -1) {
                return participant;
            }
        });

        // Loop through our participants that need expanding
        complexesToClone.forEach(complexToClone => {
            // Do we have an interaction with the same base identifier
            const match = complexToClone.interactorRef.match(/^([0-9])_[0-9]+$/);
            const baseInteractorRef = match ? match[1] : complexToClone.interactorRef;
            const foundInteraction = findFirstObjWithAttr(originalInteractions, "id", baseInteractorRef);

            // If we found an interaction then we need to clone it.
            if (foundInteraction) {
                let count = instanceCount.get(baseInteractorRef);
                if (count) {
                    count = count + 1;
                } else {
                    count = 1;
                }
                instanceCount.set(baseInteractorRef, count);
                let i = count;

                if (i > 1) {
                    // If we haven't found a complex with the same reference, then we clone it
                    if (!match || i > match[2]) {
                        cloneComplexParticipant(complexToClone, i);
                        const clonedComplex = cloneComplexInteraction(foundInteraction, i);
                        json.data.push(clonedComplex);
                        // We add the new cloned complex to this list to check
                        // if any of its participants also needs cloning
                        newInteractionsToClone.push(clonedComplex);
                    }
                }
            }
        });
    });

    // If we have cloned any complex, we need to recursively check the participants of these new cloned complexes,
    // as they may require cloning too
    if (newInteractionsToClone.length > 0) {
        cloneComplexRefsRecursively(json, originalInteractions, newInteractionsToClone, instanceCount);
    }
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
