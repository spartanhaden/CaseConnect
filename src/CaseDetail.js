import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import DiscussionThread from "./DiscussionThread";
import { ThemeContext } from "./ThemeContext";

function CaseDetail({ username }) {
  const { caseId } = useParams();
  const [caseData, setCaseData] = useState(null);
  const { theme } = useContext(ThemeContext);

  const appStyle = {
    backgroundColor: theme === "light" ? "#f0f0f0" : "#333",
    color: theme === "light" ? "#333" : "#f0f0f0",
  };

  useEffect(() => {
    const fetchCase = async () => {
      const response = await axios.get(`http://localhost:5000/case/${caseId}`);
      setCaseData(response.data);
    };
    fetchCase();
  }, [caseId]);

  return (
    <div className="case-detail" style={appStyle}>
      <div className="case-container">
        {caseData && (
          <div>
            <h1>Case {caseId}</h1>
            <CaseImages
              images={caseData.images}
              subjectIdentification={caseData.subjectIdentification}
            />
            <SubjectIdentification
              subjectIdentification={caseData.subjectIdentification}
            />
            <SubjectDescription
              subjectDescription={caseData.subjectDescription}
            />
            <PhysicalDescription
              physicalDescription={caseData.physicalDescription}
            />
            <ClothingAndAccessories
              clothingAndAccessories={caseData.clothingAndAccessoriesArticles}
            />
            <Circumstances circumstances={caseData.circumstances} />
            <LastSighting sighting={caseData.sighting} />
            <CaseIdentification
              caseIdentification={caseData.caseIdentification}
            />
            <InvestigatingAgencies
              investigatingAgencies={caseData.investigatingAgencies}
            />
            <CaseContributors caseContributors={caseData.caseContributors} />
            <DiscussionThread caseId={caseId} username={username} />
          </div>
        )}
      </div>
    </div>
  );
}

function SubjectIdentification({ subjectIdentification }) {
  return (
    <div>
      <h2>Subject Identification</h2>
      <p>First Name: {subjectIdentification.firstName}</p>
      <p>Middle Name: {subjectIdentification.middleName}</p>
      <p>Last Name: {subjectIdentification.lastName}</p>
      <p>Nicknames: {subjectIdentification.nicknames}</p>
      <p>Min Age: {subjectIdentification.currentMinAge}</p>
      <p>Max Age: {subjectIdentification.currentMaxAge}</p>
    </div>
  );
}

function CaseImages({ images, subjectIdentification }) {
  return (
    <div>
      <h2>
        {subjectIdentification.firstName} {subjectIdentification.lastName}
      </h2>
      {images.map((image, index) => (
        <div key={index}>
          <img
            src={`http://localhost:5000${image.files.original.href}`}
            alt={image.caption}
            className="case-image"
          />
          <p>Caption: {image.caption}</p>
        </div>
      ))}
    </div>
  );
}

function SubjectDescription({ subjectDescription }) {
  return (
    <div>
      <h2>Subject Description</h2>
      <p>
        Height: {subjectDescription.heightFrom} to {subjectDescription.heightTo}
      </p>
      <p>
        Weight: {subjectDescription.weightFrom} to {subjectDescription.weightTo}
      </p>
      <p>Sex: {subjectDescription.sex.name}</p>
      <p>
        Ethnicities:{" "}
        {subjectDescription.ethnicities
          .map((ethnicity) => ethnicity.name)
          .join(", ")}
      </p>
      <p>Primary Ethnicity: {subjectDescription.primaryEthnicity.name}</p>
    </div>
  );
}

function PhysicalDescription({ physicalDescription }) {
  return (
    <div>
      <h2>Physical Description</h2>
      <p>Hair Color: {physicalDescription.hairColor.name}</p>
      <p>Eye Color: {physicalDescription.leftEyeColor.name}</p>
      <p>Physical Description: {physicalDescription.headHairDescription}</p>
    </div>
  );
}

function ClothingAndAccessories({ clothingAndAccessories }) {
  return (
    <div>
      <h2>Clothing and Accessories</h2>
      {clothingAndAccessories.map((item, index) => (
        <div key={index}>
          <p>Item: {item.article.name}</p>
          <p>Description: {item.description}</p>
        </div>
      ))}
    </div>
  );
}

function LastSighting({ sighting }) {
  return (
    <div>
      <h2>Last Sighting</h2>
      <p>Date: {sighting.date}</p>
      <p>
        Location: {sighting.address.city}, {sighting.address.state.name}
      </p>
    </div>
  );
}

function CaseIdentification({ caseIdentification }) {
  return (
    <div>
      <h2>Case Identification</h2>
      <p>Case ID: {caseIdentification.id}</p>
      <p>
        Grant Permission To Publish:{" "}
        {caseIdentification.grantPermissionToPublish ? "Yes" : "No"}
      </p>
      <p>
        Case Is Resolved: {caseIdentification.caseIsResolved ? "Yes" : "No"}
      </p>
      <p>
        Pending By Ncmec: {caseIdentification.hasPendingByNcmec ? "Yes" : "No"}
      </p>
      <p>
        Ncmec Contributors:{" "}
        {caseIdentification.hasNcmecContributors ? "Yes" : "No"}
      </p>
    </div>
  );
}

function CaseContributors({ caseContributors }) {
  return (
    <div>
      <h2>Case Contributors</h2>
      {caseContributors.map((contributor, index) => (
        <div key={index}>
          <p>
            Name: {contributor.user.firstName} {contributor.user.lastName}
          </p>
          <p>Role: {contributor.user.role}</p>
        </div>
      ))}
    </div>
  );
}

function Circumstances({ circumstances }) {
  return (
    <div>
      <h2>Circumstances of Disappearance</h2>
      <p>{circumstances.circumstancesOfDisappearance}</p>
    </div>
  );
}

function InvestigatingAgencies({ investigatingAgencies }) {
  return (
    <div>
      <h2>Investigating Agencies</h2>
      {investigatingAgencies.map((agency, index) => (
        <div key={index}>
          <p>Agency Name: {agency.name}</p>
          <p>State: {agency.state.name}</p>
          <p>City: {agency.city}</p>
          <p>Case Number: {agency.caseNumber}</p>
          <p>
            Phone:{" "}
            {agency.properties && agency.properties.agency
              ? agency.properties.agency.phone
              : "N/A"}
          </p>
          <p>
            Contact Person:{" "}
            {agency.properties && agency.properties.contact
              ? `${agency.properties.contact.firstName} ${agency.properties.contact.lastName}`
              : "N/A"}
          </p>
          <p>
            Contact Job Title:{" "}
            {agency.properties && agency.properties.contact
              ? agency.properties.contact.jobTitle
              : "N/A"}
          </p>
        </div>
      ))}
    </div>
  );
}

export default CaseDetail;
