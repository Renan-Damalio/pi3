import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import Select
from webdriver_manager.chrome import ChromeDriverManager

def test_cadastro_e_exclusao_professor():
    # 1. Configuração Inicial: Abrindo o navegador
    print("Iniciando o navegador...")
    servico = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=servico)
    
    # Substitua pela URL local onde sua aplicação está rodando (ex: http://localhost:3000)
    url_da_aplicacao = "http://localhost:8000/professores" 
    
    try:
        # 2. Acessando a página
        driver.get(url_da_aplicacao)
        driver.maximize_window()
        
        # Espera explícita: Ensina o robô a esperar até 10 segundos para os elementos aparecerem
        # Isso evita erros se a página demorar um milissegundo a mais para carregar
        wait = WebDriverWait(driver, 10)

        print("Preenchendo o formulário...")
        
        # 3. Mapeando e preenchendo os campos
        # Estamos buscando os campos de input pelo atributo 'placeholder' que aparece na sua imagem
        input_nome = wait.until(EC.presence_of_element_located((By.XPATH, "//input[@placeholder='Nome Completo']")))
        input_nome.send_keys("Helder")

        input_disciplina = driver.find_element(By.XPATH, "//input[@placeholder='Disciplina']")
        input_disciplina.send_keys("Biologia")

        input_email = driver.find_element(By.XPATH, "//input[@placeholder='E-mail']")
        input_email.send_keys("rvechi.helder@gmail.com")

        # Tratando o menu suspenso (Select)
        # Assumindo que é uma tag <select>, caso não seja, buscaríamos pelo texto clicável
        # Como o valor padrão já parece ser "Professor", este passo pode ser opcional, mas é bom garantir.
        # select_perfil = Select(driver.find_element(By.XPATH, "//select"))
        # select_perfil.select_by_visible_text("Professor")

        # 4. Clicando no botão Cadastrar
        botao_cadastrar = driver.find_element(By.XPATH, "//button[contains(text(), 'Cadastrar')]")
        botao_cadastrar.click()
        
        # Pausa rápida apenas para você (humano) conseguir ver o que o robô fez
        time.sleep(2) 

        # 5. Validação (Assert): Verificando se a tabela foi atualizada
        print("Validando o cadastro...")
        # Buscamos se o nome "Helder" apareceu em alguma célula da tabela
        celula_nome = wait.until(EC.presence_of_element_located((By.XPATH, "//td[contains(text(), 'Helder')]")))
        
        if celula_nome:
            print("Sucesso: Professor Helder cadastrado e visível na tabela!")
        
        # 6. Exclusão: Clicando no botão de excluir correspondente àquela linha
        print("Testando a exclusão...")
        # Busca o botão 'Excluir' na mesma linha (tr) onde está o 'Helder'
        botao_excluir = driver.find_element(By.XPATH, "//td[contains(text(), 'Helder')]/parent::tr//button[contains(text(), 'Excluir')]")
        botao_excluir.click()
        
        time.sleep(2) # Pausa para ver a exclusão
        
        # 7. Validação Final: Garantir que o nome sumiu da página
        # Retorna uma lista; se o tamanho for 0, o elemento não existe mais
        elementos_restantes = driver.find_elements(By.XPATH, "//td[contains(text(), 'Helder')]")
        if len(elementos_restantes) == 0:
             print("Sucesso: Cadastro do Professor Helder foi excluído com sucesso!")
        else:
             print("Falha: O professor ainda aparece na tabela.")

    except Exception as e:
        print(f"Ocorreu um erro durante o teste: {e}")
        # Dica de Mentor: Em um ambiente real, investigaríamos a linha exata do erro (Traceback)

    finally:
        # 8. Encerrando o navegador (sempre importante para não deixar processos "fantasmas" na memória)
        print("Encerrando o teste.")
        driver.quit()

# Executando o teste
if __name__ == "__main__":
    test_cadastro_e_exclusao_professor()