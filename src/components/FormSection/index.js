// import { children } from "cheerio/lib/api/traversing";
import styled from "styled-components";
import { Stack, Typography } from "@mui/material";
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
  }
  .body {
    padding: 24px;
  }
  .row {
    margin: 6px 0;
  }
`;

const FormSection = ({ children, title, ...rest }) => {
  return (
    <Stack>
      <Container {...rest}>
        <div className="heading">
          {/* <Text content={title} size={20} bold color="#222222" /> */}
          <h2>{title}</h2>
        </div>
        <div className="body">{children}</div>
      </Container>
    </Stack>
  );
};

export default FormSection;
