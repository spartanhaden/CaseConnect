#!/usr/bin/env python3

import json
import os
import time

import numpy as np
import open_clip
import torch
from IPython import embed
from PIL import Image


class Clipper:
    def __init__(self, device='cpu'):
        self.device = device
        # self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

        start_time = time.time()
        print("loading model...")
        self.model, _, self.preprocess = open_clip.create_model_and_transforms('ViT-bigG-14', pretrained='laion2b_s39b_b160k', device=self.device)
        # model, _, preprocess = open_clip.create_model_and_transforms('ViT-bigG-14', pretrained='laion2b_s39b_b160k')
        # model, _, preprocess = open_clip.create_model_and_transforms('ViT-B-32-quickgelu', pretrained='laion400m_e32')
        print("model loaded in %0.2f seconds" % (time.time() - start_time))
        self.tokenizer = open_clip.get_tokenizer('ViT-bigG-14')

    def embed_image(self, case_id, image_id):
        # check if the image embeddings have already been saved (typo fix)
        if os.path.isfile(f'image_embeddings/{case_id}_{image_id}.json'):
            # print(f'image {case_id}_{image_id} has already been embedded')
            return False

        image_path = f'case_images/{case_id}_{image_id}.jpg'
        try:
            image = Image.open(image_path)
            converted_image = self.preprocess(image.convert("RGB"))
        except:
            print(f'error opening {image_path}')
            return False

        # start_time = time.time()
        # print('creating embeddings...')
        with torch.no_grad(), torch.cuda.amp.autocast():
            tensor_image = torch.stack([converted_image.to(self.device)])
            embedding = self.model.encode_image(tensor_image).float()
            # normalize
            embedding /= embedding.norm(dim=-1, keepdim=True)

            # print("embeddings created in %0.2f seconds" % (time.time() - start_time))

            output = embedding.cpu().numpy()[0].tolist()

            # save the embedding to a file
            with open(f'image_embeddings/{case_id}_{image_id}.json', "w") as f:
                json.dump(output, f)
        return True

    def embed_raw_image(self, image):
        converted_image = self.preprocess(image.convert("RGB"))

        # start_time = time.time()
        # print('creating embeddings...')
        with torch.no_grad(), torch.cuda.amp.autocast():
            tensor_image = torch.stack([converted_image.to(self.device)])
            embedding = self.model.encode_image(tensor_image).float()
            # normalize
            embedding /= embedding.norm(dim=-1, keepdim=True)

            # print("embeddings created in %0.2f seconds" % (time.time() - start_time))

            output = embedding.cpu().numpy()[0].tolist()

        # TODO test this

        return output

    def embed_text(self, query):
        start_time = time.time()
        text = self.tokenizer([query]).to(self.device)
        text_embedding = None
        with torch.no_grad(), torch.cuda.amp.autocast():
            text_embedding = self.model.encode_text(text).float()
            text_embedding /= text_embedding.norm(dim=-1, keepdim=True)
        print(f"encoded text in {time.time() - start_time} seconds")

        normie_embedding = text_embedding.cpu().numpy().flatten() #adjusted to flatten to a 1D array
        return normie_embedding

        # with torch.no_grad(), torch.cuda.amp.autocast():
        #     text = self.tokenizer([text]).to(self.device)
        #     embedding = self.model.encode_text(text).float()
        #     # normalize
        #     embedding /= embedding.norm(dim=-1, keepdim=True)

        #     output = embedding.cpu().numpy()[0].tolist()

        #     # save the embedding to a file
        #     with open(f'text_embeddings/{case_id}.json', "w") as f:
        #         json.dump(output, f)
        # return True

    # def search_images(self, query=''):
    #     text = self.tokenizer([query]).to(self.device)
    #     text_embedding = None
    #     with torch.no_grad(), torch.cuda.amp.autocast():
    #         text_embedding = self.model.encode_text(text).float()
    #         text_embedding /= text_embedding.norm(dim=-1, keepdim=True)

    #     # similarities = [text_embedding @ img_embedding.T for img_embedding in embeddings.values()]
    #     # similarity = text_embedding.cpu().numpy() @ image_features.cpu().numpy().T
    #     similarity = text_embedding @ image_features.T

    #     for i in range(len(similarity[0])):
    #         print(f"{input_keys[i]}: {similarity[0][i]*100.0:.2f}%")

    #     print()

    #     # print the similarity with the highest value but in a cuda safe way
    #     print(f"most similar image to {query}: {input_keys[np.argmax(similarity.cpu().numpy())]} - {np.max(similarity.cpu().numpy())*100.0:.2f}%")

    #     # print(f"most similar image to {query}: {input_keys[np.argmax(similarity)]} - {np.max(similarity)*100.0:.2f}%")

    #     # 1280 long

    #     embed()

    #     print()
    #     search_images('scooter')

    #     # take use your input and then search for it continuously until i exit the program
    #     while True:
    #         query = input("enter a query: ")
    #         if query == 'exit':
    #             break
    #         search_images(query)
