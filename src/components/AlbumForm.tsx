import React from "react";
import { Formik, Form, Field, FieldArray } from "formik";
import * as Yup from "yup";
import { Button } from "@Src/ui/components/ui/button";
import InputImage from "./uploadImage";
import { slugify } from "@Src/lib/slugify";
//import useApi from "@Src/app/lib/hooks/useApi";

const SelectType = ({ setFieldValue, values }: any) => (
  <Field as="select" name="albumType" className="p-1 rounded border">
    <option value="">Selecciona una opción</option>
    <option value="free">Free</option>
    <option value="premium">Premium</option>
  </Field>
);

const AdditionalFields = ({ values }: any) => (
  <FieldArray
    name="additionalFields"
    render={(arrayHelpers: any) => {
      if (values.albumType === "free") {
        return (
          <div className="flex flex-col gap-4 border border-dashed p-4 border-stone-950 rounded">
            <Field
              type="text"
              name={`additionalFields[0]`}
              placeholder="Input Free 1"
              className="p-1 rounded border"
            />
            <Field
              type="text"
              name={`additionalFields[1]`}
              placeholder="Input Free 2"
              className="p-1 rounded border"
            />
          </div>
        );
      } else if (values.albumType === "premium") {
        return (
          <div className="flex flex-col gap-4 border border-dashed p-4 border-stone-950">
            <Field
              type="text"
              name={`additionalFields[0]`}
              placeholder="Input Premium"
              className="p-1 rounded border"
            />
          </div>
        );
      }
      return null;
    }}
  />
);

const AlbumForm = ({ setIsOpenCreateAlbum }: any) => {
  //const { sendRequest, loading, error } = useApi("/api/contract/collections");

  const initialValues = {
    albumName: "",
    albumType: "",
    additionalFields: [],
    collaborators: [""],
  };

  const AlbumSchema = Yup.object().shape({
    albumName: Yup.string()
      .min(2, "*Demasiado corto")
      .max(50, "*Demasiado largo")
      .required("*Requerido"),
    albumType: Yup.string().required("*Requerido"),
    additionalFields: Yup.array().of(Yup.string()),
    collaborators: Yup.array()
      .of(Yup.string().required("El colaborador es requerido"))
      .min(1, "Se requiere al menos 1 colaborador")
      .max(5, "No se pueden agregar más de 5 colaboradores"),
  });

  const handleSubmit = async (
    values: any,
    { setSubmitting, resetForm }: any
  ) => {
    const slugName = slugify(values?.albumName);
    // const customData = {
    //   name: values.albumName,
    //   description: values.description,
    //   artist_name: values.artist,
    //   collaborators: values.collaborators,
    //   slug: slugName,
    //   image_cover: "",
    //   address_creator_collection: "",
    //   erc_type: "",
    //   contractVersion: "v1.5",
    //   mint_payway: null,
    //   mint_price: null,
    //   mint_currency: null,
    // };

    try {
      const response = await fetch("/api/collections/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: values.albumName,
          symbol: "metadata?.symbol",
          address_creator_collection: " wallet.publicKey",
          address_collection: "collectionMint.publicKey.toString()",
          description: values.description,
          max_items: 2,
          image_cover: "uploadImage.metadataUri",
          slug: slugName,
          network: "allfeat",
          mint_price: "2",
          mint_currency: "metadata?.currency",
          base_url_image: "uploadImage.baseUrl",
          candy_machine: "candyMachine.publicKey.toString()",
          community: "tuneport",
          artist_name: values.artist,
          collaborators: [],
        }),
      });

      const dataResponse = await response.json();
      // console.log("Data Response: ", dataResponse);
      resetForm();
      setIsOpenCreateAlbum(false);
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={AlbumSchema}
      onSubmit={handleSubmit}
    >
      {({ values }) => (
        <Form className="flex flex-col gap-4 w-full">
          <div className="flex flex-col gap-4">
            <Field
              type="text"
              name="albumName"
              placeholder="Nombre del Álbum"
              className="p-1 rounded border w-full"
            />
            <Field
              type="text"
              name="description"
              component="textarea"
              placeholder="Description"
              className="p-1 rounded border"
            />
            <SelectType values={values} />
            <AdditionalFields values={values} />
            <Field
              type="text"
              name="artist"
              placeholder="Artista"
              className="p-1 rounded border"
            />
            <Field
              type="text"
              name="genere"
              placeholder="Género Musical"
              className="p-1 rounded border"
            />
            <FieldArray
              name="collaborators"
              render={(arrayHelpers) => (
                <div className="flex flex-col gap-4 border border-dashed p-4 border-stone-950 rounded">
                  {values.collaborators && values.collaborators.length > 0 ? (
                    values.collaborators.map((collaborator, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Field
                          name={`collaborators.${index}`}
                          placeholder="Colaborador"
                          className="p-1 rounded border w-full"
                        />
                        <Button
                          type="button"
                          onClick={() => arrayHelpers.remove(index)}
                          disabled={values.collaborators.length === 1}
                        >
                          Remove
                        </Button>
                      </div>
                    ))
                  ) : (
                    <Button type="button" onClick={() => arrayHelpers.push("")}>
                      Add Collaborator
                    </Button>
                  )}
                  <Button
                    type="button"
                    onClick={() => arrayHelpers.push("")}
                    disabled={values.collaborators.length >= 5}
                  >
                    Add Collaborator
                  </Button>
                </div>
              )}
            />
            <Field
              type="number"
              name="supply"
              placeholder="Supply"
              className="p-1 rounded border"
            />
            <Field
              type="text"
              name="symbol"
              placeholder="Symbol"
              className="p-1 rounded border"
            />
            <InputImage handleImageChange={""} showPreview={true} id="" />
          </div>
          <div className="flex items-baseline justify-between">
            <div className="flex items-start">
              <Button type="submit" className="mt-4">
                {"Create Albúm"}
                {/* disabled={loading} */}
                {/* {loading ? "Creating..." : "Create Albúm"} */}
              </Button>
            </div>
            <div className="flex items-end">
              <Button
                type="button"
                onClick={() => setIsOpenCreateAlbum(false)}
                className="self-center ml-4"
              >
                Cerrar
              </Button>
            </div>
          </div>
          {/* {error && <div className="text-red-500">{error}</div>} */}
        </Form>
      )}
    </Formik>
  );
};

export default AlbumForm;
