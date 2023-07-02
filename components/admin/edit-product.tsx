import React, { ReactNode, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Cross1Icon } from "@radix-ui/react-icons";
import { ToastProvider, ToastViewport } from "@radix-ui/react-toast";
import { Toast } from "../shared/toast";
import axios from "axios";
import z from "zod";
import FieldErrors from "../shared/fieldErrors";
import { Category, productSchema } from "@/lib/schema";
import { faImage } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Image from "next/image";

export default function EditProduct({
  product,
  onUpdate,
  category,
  trigger,
}: {
  product: z.infer<typeof productSchema>;
  onUpdate: Function;
  category: Category | undefined;
  trigger: ReactNode;
}) {
  const defaultErrors = {
    id: [""],
    image: [""],
    name: [""],
    price: [""],
    stock: [""],
    categoryId: [""],
    variants: [""],
  };

  const [success, setSuccess] = useState("");
  const [formErrors, setFormErrors] = useState(defaultErrors);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [openErr, setOpenErr] = useState(false);
  const [image, setImage] = useState(product.image);
  const [currentProduct, setCurrentProduct] = useState(product);

  const imageRef = useRef<HTMLInputElement>(null);

  const uploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormErrors((prevState) => ({ ...prevState, image: [] }));

    let data = new FormData();
    data.append("image", e.target.files?.item(0) as File);

    const options = {
      method: "POST",
      url: "/api/images",
      data: data,
    };

    axios
      .request(options)
      .then((res) => {
        const imageUrl = z.object({ image: z.string() }).safeParse(res.data);
        if (imageUrl.success) {
          currentProduct.image = `${process.env.NEXT_PUBLIC_APP_HOST}/uploads/${imageUrl.data.image}`;
          setImage(currentProduct.image);
        }
      })
      .catch((err) => {
        setFormErrors((prevState) => ({
          ...prevState,
          image: [err.response.data.error],
        }));
      });
  };

  const handleSubmit = async () => {
    setError("");
    setFormErrors(defaultErrors);

    if (!currentProduct.image) {
      setFormErrors((prev) => ({ ...prev, image: ["Image can not be empty"] }));
      return;
    }

    const options = {
      method: "PATCH",
      url: `/api/products/${product.id}`,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      data: {
        id: product.id,
        image: currentProduct.image,
        name: currentProduct.name,
        price: currentProduct.price,
        stock: currentProduct.stock,
        categoryId: category?.id,
        variants: product.variants,
      },
    };
    axios
      .request(options)
      .then(() => {
        setSuccess("Product updated successfully");
        setOpen(true);
        onUpdate();
      })
      .catch((err) => {
        if (err.response.status === 400) {
          setFormErrors(err.response.data.error);
          console.log(formErrors);
        } else if (err.response.status === 403) {
          const result = z.string().safeParse(err.response.data.error);
          if (result.success) {
            setError(result.data);
            setOpenErr(true);
          }
        }
      });
  };

  return (
    <ToastProvider swipeDirection="right">
      <Toast
        severity="error"
        content={error}
        open={openErr}
        setOpen={setOpenErr}
      >
        <button onClick={() => setOpenErr(false)}>
          <Cross1Icon />
        </button>
      </Toast>
      <Toast severity="success" content={success} open={open} setOpen={setOpen}>
        <button onClick={() => setOpen(false)}>
          <Cross1Icon />
        </button>
      </Toast>
      <Dialog.Root>
        <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Overlay className="bg-black/60 w-screen h-screen fixed top-0" />
          <Dialog.Content className="bg-white dark:bg-zinc-800 rounded-lg p-5 shadow-sm fixed w-[720px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <Dialog.Title className="DialogTitle pb-3 text-lg font-semibold">
              Update Product
            </Dialog.Title>
            <Dialog.Description className="DialogDescription">
              Make changes to this product
            </Dialog.Description>
            <div className="pt-2 flex gap-4">
              <section>
                <fieldset className="grid">
                  {currentProduct.image ? (
                    <Image
                      src={image}
                      alt="Uploaded image"
                      className="max-w-[270px] h-full max-h-[180px] object-contain"
                      width={270}
                      height={180}
                    ></Image>
                  ) : (
                    <div
                      className="w-[270px] h-[180px] border-2 border-gray-300 rounded-lg flex items-center justify-center dark:border-zinc-700 dark:text-zinc-700 hover:bg-gray-400 dark:hover:bg-zinc-900 cursor-pointer"
                      onClick={() => {
                        imageRef.current ? imageRef.current.click() : null;
                      }}
                    >
                      <FontAwesomeIcon icon={faImage} className="w-12 h-12" />
                      <input
                        ref={imageRef}
                        type="file"
                        className="hidden"
                        onChange={(e) => uploadImage(e)}
                      />
                    </div>
                  )}
                  <FieldErrors errors={formErrors?.image} />
                </fieldset>
              </section>
              <section className="grow">
                <fieldset className="grid">
                  <label htmlFor="name">Name</label>
                  <FieldErrors errors={formErrors?.name} />
                  <input
                    type="text"
                    className="w-full py-2 px-3 bg-gray-100 dark:bg-zinc-900 rounded-lg hover:bg-gray-200 dark:hover:bg-zinc-950 focus:bg-gray-200 dark:focus:bg-zinc-950"
                    id="name"
                    value={currentProduct.name}
                    onChange={(e) =>
                      setCurrentProduct((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    autoComplete={"off"}
                    required={true}
                  />
                </fieldset>
                <div className="flex gap-3">
                  <fieldset className="grid pt-2">
                    <label htmlFor="price">Price</label>
                    <FieldErrors errors={formErrors?.price} />
                    <input
                      className="w-full py-2 px-3 bg-gray-100 dark:bg-zinc-900 rounded-lg hover:bg-gray-200 dark:hover:bg-zinc-950 focus:bg-gray-200 dark:focus:bg-zinc-950"
                      id="price"
                      value={currentProduct.price || 0}
                      onChange={(e) =>
                        setCurrentProduct((prev) => ({
                          ...prev,
                          price: parseInt(e.target.value),
                        }))
                      }
                      required={true}
                    />
                  </fieldset>
                  <fieldset className="grid pt-2">
                    <label htmlFor="stock">Stock</label>
                    <FieldErrors errors={formErrors?.stock} />
                    <input
                      type="number"
                      className="w-full py-2 px-3 bg-gray-100 dark:bg-zinc-900 rounded-lg hover:bg-gray-200 dark:hover:bg-zinc-950 focus:bg-gray-200 dark:focus:bg-zinc-950"
                      id="stock"
                      value={currentProduct.stock}
                      onChange={(e) =>
                        setCurrentProduct((prev) => ({
                          ...prev,
                          stock: parseInt(e.target.value),
                        }))
                      }
                      required={true}
                    />
                  </fieldset>
                </div>
              </section>
            </div>
            <div className="flex justify-end pt-5">
              <button
                onClick={handleSubmit}
                className="py-2 px-3 bg-green-600 hover:bg-green-800 rounded-lg text-white font-medium cursor-pointer"
              >
                Update product
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
      <ToastViewport className="fixed bottom-0 right-0 flex flex-col gap-3 w-96 max-w-[100vw] m-0 z-50 outline-none p-6" />
    </ToastProvider>
  );
}
