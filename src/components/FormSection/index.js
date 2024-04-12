// import { children } from "cheerio/lib/api/traversing";
import styled from "styled-components";
import { Stack, Typography } from "@mui/material";
import { useState } from "react";
import { motion } from "framer-motion";
const Container = styled.div`
  width: 100%;
  // min-height: 60vh;
  margin-bottom: 24px;
  align-self: flex-start;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  /* Gray/300 */

  border: 1px solid #cccccc;
  /* Card Shadow */

  box-shadow: 0px 2px 2px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  ${(props) => props.containerCSS || null}
  .heading {
    padding: 12px 24px;
    border-bottom: 1px solid #cccccc;
    transition: all 0.4s;
    &:hover {
      background-color: #09990939;
    }
  }
  .body {
    padding: 24px;
  }
  .row {
    margin: 6px 0;
  }
`;

const FormSection = ({ children, title, showSection, ...rest }) => {
  const [expanded, setExpanded] = useState(showSection || false);
  return (
    <Stack>
      <Container {...rest}>
        <div className="heading">
          {/* <Text content={title} size={20} bold color="#222222" /> */}
          <h2
            role="button"
            onClick={(e) => setExpanded(!expanded)}
            style={{
              cursor: "pointer",
            }}
          >
            {title}
          </h2>
        </div>
        {expanded && (
          <motion.div
            initial={{ opacity: 0.3, y: -10 }} // Initial state (hidden and slightly above)
            animate={{ opacity: 1, y: 0 }} // Animation when component mounts (visible and at normal position)
            transition={{ duration: 0.3 }}
            className="body"
          >
            {children}
          </motion.div>
        )}
      </Container>
    </Stack>
  );
};

export default FormSection;
