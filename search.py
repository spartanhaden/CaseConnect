#!/usr/bin/env python3

import glob
import json
import subprocess
import os
import time

import numpy as np
import open_clip
import torch
from IPython import embed
from PIL import Image
from sklearn.neighbors import NearestNeighbors
from torchinfo import summary
import openai


class Search:
    def __init__(self, clipper):
        self.clipper = clipper

        self.knn_amount = 10

        self.text_embedding_and_case_id_list = self.load_text_embeddings()
        self.image_embedding_and_case_id_and_image_id_list = self.load_image_embeddings()

        self.text_nearest_neighbors_ada_2 = self.load_text_nearest_neighbors()
        self.image_nearest_neighbors_open_clip = self.load_image_nearest_neighbors()

    def load_text_embeddings(self):
        # make list of pairs of embedding and case_id that is indices
        text_embedding_and_case_id = []

        embedding_file_paths = glob.glob('text_embeddings/*.json')
        embedding_file_paths.sort()

        for filepath in embedding_file_paths:
            case_id = int(filepath.split('/')[-1].split('.')[0])

            with open(filepath, 'r') as f:
                embedding = json.load(f)

                text_embedding_and_case_id.append((embedding, case_id))

        # sort by case id
        text_embedding_and_case_id.sort(key=lambda x: x[1])

        # print how many embeddings there are
        print(f'number of text embeddings: {len(text_embedding_and_case_id)}')

        return text_embedding_and_case_id

    def load_image_embeddings(self):
        # make a list of pairs of embedding and case_id and image_id
        image_embedding_and_case_id_and_image_id = []

        image_embedding_file_paths = glob.glob('image_embeddings/*.json')
        image_embedding_file_paths.sort()

        for filepath in image_embedding_file_paths:
            case_id = int(filepath.split('/')[-1].split('_')[0])
            image_id = int(filepath.split('/')[-1].split('_')[1].split('.')[0])

            with open(filepath, 'r') as f:
                embedding = json.load(f)

                image_embedding_and_case_id_and_image_id.append((embedding, case_id, image_id))

        # sort by case id and image id
        image_embedding_and_case_id_and_image_id.sort(key=lambda x: (x[1], x[2]))

        # print how many embeddings there are
        print(f'number of image embeddings: {len(image_embedding_and_case_id_and_image_id)}')

        return image_embedding_and_case_id_and_image_id

    def load_text_nearest_neighbors(self):
        formatted_embeddings_list_np = np.array([np.array(embedding) for embedding, _ in self.text_embedding_and_case_id_list])

        start_time = time.time()
        nearest_neighbors = NearestNeighbors(n_neighbors=self.knn_amount, metric='cosine', algorithm='auto').fit(formatted_embeddings_list_np)
        print(f'created NearestNeighbors instance in {time.time() - start_time} seconds')

        return nearest_neighbors

    def load_image_nearest_neighbors(self):
        formatted_embeddings_list_np = np.array([np.array(embedding) for embedding, _, _ in self.image_embedding_and_case_id_and_image_id_list])

        start_time = time.time()
        nearest_neighbors = NearestNeighbors(n_neighbors=self.knn_amount, metric='cosine', algorithm='auto').fit(formatted_embeddings_list_np)
        print(f'created NearestNeighbors instance in {time.time() - start_time} seconds')

        return nearest_neighbors

    def search_with_text_clip(self, text):
        # get the embedding
        text_embedding = self.clipper.get_text_embedding(text)

        # get the image nearest neighbors
        distances, indices = self.image_nearest_neighbors_open_clip.kneighbors([text_embedding])

        # get a list of length self.knn_amount of pairs of case_id and image_id from image_embedding_and_case_id_and_image_id_list
        case_id_and_image_id_list = [self.image_embedding_and_case_id_and_image_id_list[index][1:] for index in indices[0]]

        print(f'case_id_and_image_id_list: {case_id_and_image_id_list}')

        # TODO test this and logic

    def search_with_image_clip(self, image_filepath):
        # get the image
        try:
            image = Image.open(image_filepath)
        except:
            print(f'could not open image at {image_filepath}')
            return

        # get the embedding
        image_embedding = self.clipper.embed_raw_image(image)

        # get the text nearest neighbors
        distances, indices = self.text_nearest_neighbors_ada_2.kneighbors([image_embedding])

        # get a list of length self.knn_amount of case_ids from text_embedding_and_case_id_list
        case_id_list = [self.text_embedding_and_case_id_list[index][1] for index in indices[0]]

        print(f'case_id_list: {case_id_list}')

        # TODO test this and logic

    def search_with_text_ada_2(self, text):
        embedding = openai.Embedding.create(input=text, model="text-embedding-ada-002")["data"][0]["embedding"]

        # get the image nearest neighbors
        distances, indices = self.text_nearest_neighbors_ada_2.kneighbors([embedding])

        # get a list of length self.knn_amount of pairs of case_id from self.text_embedding_and_case_id_list
        for i in range(self.knn_amount):
            index = indices[0][i]
            current_match = self.text_embedding_and_case_id_list[index]

            case_id = current_match[1]

            distance = distances[0][i]

            # print the distance in green
            print(f'distance - \033[92m{distance}\033[0m')
            # print the case id in cyan
            print(f'case_id - \033[96m{case_id}\033[0m')

            # load the json file
            with open(f'json_cases/{case_id}.json', 'r') as f:
                case_json = json.load(f)
                print(f'case_json: {case_json}')

        embed()

        # TODO test this and logic

    def run(self):
        while True:
            print()
            query = input("enter a query type: ('text-to-clip', 'text-to-ada', 'image-to-clip' 'exit') ")
            if query == 'exit':
                print('exiting')
                break
            elif query == 'text-to-clip':
                query = input("enter a search term: ")
                self.search_with_text_clip(query)
            elif query == 'text-to-ada':
                query = input("enter a search term: ")
                self.search_with_text_ada_2(query)
            elif query == 'image-to-clip':
                filepath = input("enter an image path : ")
                self.search_with_image_clip(filepath)
            else:
                print('invalid query type')
                continue
