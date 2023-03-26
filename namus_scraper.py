#!/usr/bin/env python3

import glob
import json
import os
import sys
import threading
import time
from concurrent.futures import ThreadPoolExecutor, as_completed

import openai
import requests
from dotenv import load_dotenv
from IPython import embed

from clipper import Clipper
from search import Search


class NamusScraper:
    def __init__(self):
        load_dotenv()

        openai.api_key = os.getenv('OPENAI_API_KEY')

        self.base_url = "https://www.namus.gov"
        self.case_url = self.base_url + "/api/CaseSets/NamUs/MissingPersons/Cases/"
        self.downloaded_cases = []
        self.downloaded_images = []

        # use glob to get the list of all the json files in the json_cases folder
        case_names = glob.glob("json_cases/*.json")

        # add the case id to the list of downloaded cases
        for case_name in case_names:
            case_id = case_name.split("/")[1].split(".")[0]
            self.downloaded_cases.append(case_id)

        self.downloaded_cases.sort()

        print(f'found {len(self.downloaded_cases)} downloaded cases')

        image_names = glob.glob("case_images/*")

        for image_name in image_names:
            # 'image_id'_'case_id'
            image_id_pair = image_name.split("/")[1].split(".")[0]
            self.downloaded_images.append(image_id_pair.split("_"))

        print(f'found {len(self.downloaded_images)} downloaded images')

    def get_case_from_api(self, case_id):
        try:
            response = requests.get(f"{self.case_url}{case_id}")
            response.raise_for_status()
            case = response.text

            # save it to a file
            with open(f"json_cases/{case_id}.json", "w") as f:
                f.write(case)

            return case_id
        except requests.exceptions.RequestException as e:
            return f"An error occurred while downloading the web page: {e}"

    def get_image_links_from_case(self, case_id):
        # open the json file
        with open(f"json_cases/{case_id}.json", "r") as f:
            case = f.read()

        # parse the json file
        case = json.loads(case)

        # get the images from the case
        images = case["images"]

        # get the links from the images
        links = [image["hrefDownload"] for image in images]

        # extract the image ids and return them
        return [link.split("/")[-2] for link in links]

    def download_image(self, case_id, image_id):
        image_download_url = self.base_url + f'/api/CaseSets/NamUs/MissingPersons/Cases/{case_id}/Images/{image_id}/Download'

        try:
            response = requests.get(image_download_url)
            response.raise_for_status()
            image = response.content

            # save it to case_images/{case_id}_{image_id}
            with open(f"case_images/{case_id}_{image_id}.jpg", "wb") as f:
                f.write(image)

            return case_id, image_id
        except requests.exceptions.RequestException as e:
            return f"An error occurred while downloading the web page: {e}"

    def download_new_images(self):
        # get the links from all the self.downloaded_cases
        images = []
        num_threads = 16
        futures = []

        for case_id in self.downloaded_cases:
            for image_id in self.get_image_links_from_case(case_id):
                images.append((case_id, image_id))

        print(f'found {len(images)} images in json')

        images_to_download = []

        for image in images:
            case_id = image[0]
            image_id = image[1]

            # check if the image has already been downloaded
            if [case_id, image_id] not in self.downloaded_images:
                images_to_download.append(image)

        # Create a ThreadPoolExecutor with 8 worker threads
        with ThreadPoolExecutor(max_workers=num_threads) as executor:
            # Submit tasks to the executor
            for case_id, image_id in images_to_download:
                future = executor.submit(self.download_image, case_id, image_id)
                futures.append(future)

            # Wait for all tasks to complete and handle their results
            for future in as_completed(futures):
                case_id, image_id = future.result()

    def download_new_pages(self):
        # set to the last case id that was downloaded
        starting_case_id = int(self.downloaded_cases[-1])
        num_threads = 16
        futures = []

        # Create a ThreadPoolExecutor with 8 worker threads
        with ThreadPoolExecutor(max_workers=num_threads) as executor:
            # Submit tasks to the executor
            for case_id in range(starting_case_id, starting_case_id + 1000):
                future = executor.submit(self.get_case_from_api, case_id)
                futures.append(future)

            # Wait for all tasks to complete and handle their results
            for future in as_completed(futures):
                case_id = future.result()
                print(f'downloaded case {case_id}')

    def tokenize_all_the_files(self):
        import tiktoken
        enc = tiktoken.get_encoding("cl100k_base")

        # get the list of all the json files in the json_cases folder
        case_names = glob.glob("json_cases/*.json")

        token_totel = 0

        for i, case_name in enumerate(case_names):
            if i % 100 == 0:
                print(f'case {i}')
            with open(case_name, "r") as f:
                case = f.read()

                # tokenize the case
                case_tok = enc.encode(case)

                token_totel += len(case_tok)

                if len(case_tok) > 8000:
                    print(f'case {case_name} is too long')
                    print(f'len(case_tok) = {len(case_tok)}')

        print(f'token_totel = {token_totel}')

    def embed_all_the_case_files(self):
        # get the list of all the json files in the json_cases folder
        case_names = glob.glob("json_cases/*.json")

        for i, case_name in enumerate(case_names):
            case_id = case_name.split("/")[-1].split(".")[0]
            self.embed_file(case_id)

            # print the fraction and the percentage complete two decimal places
            print(f'{i + 1}/{len(case_names)} = {i/len(case_names):.2%}')

    def embed_file(self, case_id):
        # check if the file has already been embedded
        if os.path.exists(f"text_embeddings/{case_id}.json"):
            # print(f'case {case_id} has already been embedded')
            return

        # get the json file
        with open(f"json_cases/{case_id}.json", "r") as f:
            case = f.read()

        embedding = openai.Embedding.create(input=case, model="text-embedding-ada-002")["data"][0]["embedding"]

        # save the embedding to a file
        with open(f"text_embeddings/{case_id}.json", "w") as f:
            f.write(json.dumps(embedding))

        print(f'embedded case {case_id}')


if __name__ == "__main__":
    scraper = NamusScraper()
    # scraper.download_new_pages()
    # scraper.download_new_images()
    # scraper.tokenize_all_the_files()
    # scraper.embed_all_the_case_files()

    clipper = Clipper('cpu')

    search = Search(clipper)
    # search = Search(None)

    search.run()

    # count = 0
    # start_time = time.time()

    # for i, (case_id, image_id) in enumerate(scraper.downloaded_images):
    #     successful = clipper.embed_image(case_id, image_id)
    #     if successful:
    #         count += 1

    #     # print the image rate of count since start_time
    #     rate = count / (time.time() - start_time)

    #     print(f'{i + 1}/{len(scraper.downloaded_images)} = {i/len(scraper.downloaded_images):.2%} - {rate:.2f} images/s')
