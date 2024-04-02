"use client";
import { useState } from "react";
import PhotoAlbum from "react-photo-album";
import Lightbox from "yet-another-react-lightbox";
import {
  Download,
  Fullscreen,
  Zoom,
  Thumbnails,
} from "yet-another-react-lightbox/plugins";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/thumbnails.css";
import CustomBreadcrumbs from "@/components/CustomBreadcrumbs";
import { Button, Grid } from "@mui/material";
import Link from "next/link";

const images = [
  { id: 1, src: "/Image-1.jpg", width: 800, height: 600 },
  { id: 2, src: "/Image-3.jpg", width: 1600, height: 900 },
  { id: 3, src: "/Image-1.jpg", width: 1600, height: 900 },
  { id: 4, src: "/Image-2.jpg", width: 1600, height: 900 },
  { id: 5, src: "/Image-2.jpg", width: 1600, height: 900 },
  { id: 6, src: "/Img-1.jpg", width: 1600, height: 900 },
  { id: 7, src: "/Image-1.jpg", width: 1600, height: 900 },
  { id: 8, src: "/Img-1.jpg", width: 1600, height: 900 },
  { id: 9, src: "/Image-2.jpg", width: 1600, height: 900 },
  { id: 10, src: "/Image-3.jpg", width: 1600, height: 900 },
];
const GalleryPage = () => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(-1);

  return (
    <div>
      <CustomBreadcrumbs
        title={"Gallery"}
        links={[
          {
            path: "/gallery",
            title: "Gallery",
            active: true,
          },
        ]}
      />
      <Grid container justifyContent="flex-end" mb={2}>
        <Link passHref href="/gallery/add">
          <Button variant="contained">+ Add Photo</Button>
        </Link>
      </Grid>
      <div>
        <div style={{ padding: "70px", borderRadius: "10px" }}>
          <PhotoAlbum
            styles={{ borderRadius: "10px" }}
            className="photo"
            layout="rows"
            photos={images}
            onClick={({ index }) => setSelectedImageIndex(index)}
          />
        </div>

        <Lightbox
          plugins={[Download, Fullscreen, Zoom, Thumbnails]}
          index={selectedImageIndex}
          open={selectedImageIndex >= 0}
          slides={images}
          close={() => setSelectedImageIndex(-1)}
        />
      </div>
    </div>
  );
};

export default GalleryPage;
